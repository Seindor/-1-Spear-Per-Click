import { RunService } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

import { ParseRobloxAliasPath } from "shared/Utilities/GetObjectFromPath";
import type { MotionState } from "shared/Domain/Motion/Types/MotionTypes";
import type { MovementAnimationTarget } from "shared/Types/Gameplay/Animations/MovementAnimationTypes";

const sharedScope = CompositionRootShared.createScope();

const animationsAPI = sharedScope.resolve(SharedRegistry.Singletons.API.AnimationsAPI);
const motionAPI = sharedScope.resolve(SharedRegistry.Singletons.API.MotionAPI);

const DEFAULT_ANIMATIONS_PACK = ParseRobloxAliasPath(
    "shared/Assets/Animations/Default/Movement",
) as Folder;

const MOVEMENT_STATE_MAP = new Map<string, string>([
    ["Forward", "Walk"],
    ["Backward", "Walk"],
    ["Left", "Walk"],
    ["Right", "Walk"],
    ["ForwardLeft", "Walk"],
    ["ForwardRight", "Walk"],
    ["BackwardLeft", "Walk"],
    ["BackwardRight", "Walk"],
]);

type AerialState = "None" | "Jumping" | "Falling" | "Landing";

export class ClientMovementAnimationHandler {
    public RUN_SPEED_THRESHOLD = 15;
    public enableAnimations = true;

    public MIN_JUMP_DURATION = 0.15;

    public GROUND_STATE_DEBOUNCE = 0.05;

    public RUN_JUMP_SPEED_MULTIPLIER = 0.5;

    private readonly janitor = new Janitor<any>();

    private readonly character: Model;
    private readonly rootPart: BasePart;
    private readonly humanoid: Humanoid;
    private readonly animationsPack: Folder;

    private readonly animator: ReturnType<typeof animationsAPI.CreateAnimator>;
    private readonly motion: ReturnType<typeof motionAPI.CreateMotion>;

    private readonly compositeId: string;

    private currentAnimation?: string;
    private aerialState: AerialState = "None";

    private jumpStartedAt = 0;
    private pendingFallThread?: thread;

    private groundCandidate?: string;
    private groundCandidateSince = 0;

    private runSlowedForJump = false;

    constructor(
        private readonly ownerId: string,
        private readonly modelKey: string,
        target: MovementAnimationTarget,
    ) {
        this.character = target.character;
        this.rootPart = target.rootPart;
        this.humanoid = target.humanoid;
        this.animationsPack = target.animationsPack ?? DEFAULT_ANIMATIONS_PACK;

        this.compositeId = `${ownerId}:${modelKey}`;

        this.animator = animationsAPI.CreateAnimator(
            { Character: this.character, Animator: target.animator },
            "Movement",
            this.compositeId,
        );

        this.motion = motionAPI.CreateMotion(
            { RootPart: this.rootPart, Humanoid: this.humanoid },
            this.compositeId,
            "Motion",
        );

        this.BindHumanoidState();
        this.BindHeartbeat();
    }

    // ── воспроизведение ──────────────────────────────────────────────────────

    private getAnimation(state: string): Animation | undefined {
        return this.animationsPack.FindFirstChild(state) as Animation | undefined;
    }

    private getBaseSpeed(animation: Animation): number {
        return (animation.GetAttribute(`Speed`) as number) ?? 1;
    }

    /**
     * @param state Имя состояния — ищется анимация "<state>" в паке.
     * @param force Перезапустить, даже если это же состояние уже играет.
     * @param speedMultiplier Множитель к базовой скорости анимации (атрибут "Speed").
     */
    private playState(state: string, force = false, speedMultiplier = 1): string | undefined {
        const finalAnimationName = `Movement_${state}`;

        if (!force && this.currentAnimation === finalAnimationName) return finalAnimationName;

        const animationInstance = this.getAnimation(state);

        if (!animationInstance) {
            warn(
                `[ClientMovementAnimationHandler] Animation "${state}" not found for ${this.compositeId}`,
            );
            return undefined;
        }

        this.currentAnimation = finalAnimationName;

        const isTransient = state === `Jump` || state === `Landing`;

        this.animator.StopAnimation(`Movement`, 0.2, true, true, [finalAnimationName]);

        this.animator.PlayAnimation(
            animationInstance,
            finalAnimationName,
            true,
            Enum.AnimationPriority.Movement,
            !isTransient,
            undefined,
            undefined,
            this.getBaseSpeed(animationInstance) * speedMultiplier,
            () => {
                if (this.currentAnimation === finalAnimationName) {
                    this.currentAnimation = undefined;
                }
            },
        );

        return finalAnimationName;
    }

    /** Меняет скорость УЖЕ ИГРАЮЩЕГО трека напрямую, без Stop/Play — без рывка. */
    private adjustCurrentTrackSpeed(state: string, speedMultiplier: number): boolean {
        const finalAnimationName = `Movement_${state}`;
        const track = this.animator.animationsTracks.get(finalAnimationName);
        if (!track) return false;

        const animationInstance = this.getAnimation(state);
        const baseSpeed = animationInstance ? this.getBaseSpeed(animationInstance) : 1;

        track.AdjustSpeed(baseSpeed * speedMultiplier);
        return true;
    }

    private resolveGroundState(motionState: MotionState): string {
        if (motionState.IsMoving) {
            const combinedTag = motionState.Direction3DTags.join("");
            const resolved = MOVEMENT_STATE_MAP.get(combinedTag);

            if (resolved) {
                return motionState.Speed >= this.RUN_SPEED_THRESHOLD ? "Run" : resolved;
            }
        }

        return "Idle";
    }

    // ── события Humanoid: прыжок / падение / приземление ────────────────────

    private CancelPendingFall(): void {
        if (this.pendingFallThread) {
            task.cancel(this.pendingFallThread);
            this.pendingFallThread = undefined;
        }
    }

    private BindHumanoidState(): void {
        this.janitor.Add(
            this.humanoid.StateChanged.Connect((_old, newState) => {
                if (newState === Enum.HumanoidStateType.Jumping) {
                    this.CancelPendingFall();

                    this.aerialState = "Jumping";
                    this.jumpStartedAt = os.clock();

                    const motionState = this.motion.GetState();
                    const isRunning =
                        motionState.IsMoving && motionState.Speed >= this.RUN_SPEED_THRESHOLD;

                    if (isRunning) {
                        this.runSlowedForJump = true;

                        const adjusted =
                            this.currentAnimation === `Movement_Run` &&
                            this.adjustCurrentTrackSpeed(`Run`, this.RUN_JUMP_SPEED_MULTIPLIER);

                        if (!adjusted) {
                            this.playState(`Run`, true, this.RUN_JUMP_SPEED_MULTIPLIER);
                        }
                    } else {
                        this.playState(`Jump`, true);
                    }
                } else if (newState === Enum.HumanoidStateType.Freefall) {
                    if (this.aerialState === "Falling") return;

                    const elapsed = os.clock() - this.jumpStartedAt;
                    const remaining = this.MIN_JUMP_DURATION - elapsed;

                    this.CancelPendingFall();

                    const commitFalling = () => {
                        this.aerialState = "Falling";
                        this.runSlowedForJump = false;
                        this.playState(`Falling`, true);
                    };

                    if (remaining > 0) {
                        this.pendingFallThread = task.delay(remaining, () => {
                            this.pendingFallThread = undefined;
                            commitFalling();
                        });
                    } else {
                        commitFalling();
                    }
                } else if (newState === Enum.HumanoidStateType.Landed) {
                    this.CancelPendingFall();

                    this.aerialState = "Landing";
                    this.runSlowedForJump = false;
                    this.playState(`Landing`, true);
                } else if (
                    newState === Enum.HumanoidStateType.Running ||
                    newState === Enum.HumanoidStateType.RunningNoPhysics
                ) {
                    this.CancelPendingFall();

                    if (this.runSlowedForJump) {
                        this.runSlowedForJump = false;
                        this.adjustCurrentTrackSpeed(`Run`, 1);
                    }

                    this.aerialState = "None";
                }
            }),
            "Disconnect",
        );

        this.janitor.Add(
            this.humanoid.Died.Connect(() => this.StopAllAnimations()),
            "Disconnect",
        );
    }

    // ── Heartbeat: только ground-состояния (Idle/Walk/Run), с дебаунсом ──────

    private BindHeartbeat(): void {
        this.janitor.Add(
            RunService.Heartbeat.Connect(() => {
                if (this.aerialState === "Jumping" || this.aerialState === "Falling") return;

                if (!this.enableAnimations) {
                    this.animator.StopAnimation(`Movement`, 0, true, true);
                    return;
                }

                const motionState = this.motion.GetState();
                const candidate = this.resolveGroundState(motionState);

                if (candidate !== this.groundCandidate) {
                    this.groundCandidate = candidate;
                    this.groundCandidateSince = os.clock();
                }

                if (os.clock() - this.groundCandidateSince < this.GROUND_STATE_DEBOUNCE) return;

                this.playState(candidate);
            }),
            "Disconnect",
        );
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    public StopAllAnimations(): void {
        this.CancelPendingFall();
        this.animator.StopAnimation(`Movement`, 0, true, true);
        this.currentAnimation = undefined;
        this.aerialState = "None";
        this.runSlowedForJump = false;
    }

    public Destroy(): void {
        this.CancelPendingFall();
        this.janitor.Cleanup();
        animationsAPI.RemoveActorAnimator(this.compositeId, "Movement", true, true);
        motionAPI.RemoveActorMotion(this.compositeId, "Motion");
    }
}
