import { Workspace, StarterGui } from "@rbxts/services";

import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { IStepConfig } from "shared/Domain/Pipeline/Types/PipelineTypes";

import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class UIInitStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `UIInitStep`;

    public Before = [`LoadReplicatorsStep`];

    public Config = {
        launchParallel: true,
    } as IStepConfig;

    public _janitor = janitorAPI.CreateActor(`UI`);

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let sampleInterface = StarterGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        this.AutoScaleUiStroke(ctx);

        while (playerInterface.GetDescendants().size() < sampleInterface.GetDescendants().size()) {
            task.wait();
            print(
                `Waiting for ui loads, ${playerInterface.GetDescendants().size()!} / ${sampleInterface.GetDescendants().size()}`,
            );
        }

        this.AutoScaleUiStroke(ctx);

        ctx.MarkCompleted(this.Id);
    }

    private AutoScaleUiStroke(ctx: PipelineContext<ClientPlayerContext>) {
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        let janitor = this._janitor.Create(`UIInit`);

        // Базовую толщину храним ОТДЕЛЬНО от текущей (уже отскейленной) —
        // иначе повторный пересчёт будет применяться поверх уже применённого
        // масштаба и толщина "уползёт".
        const baseThickness = new Map<UIStroke, number>();

        const GetScaleFactor = (): number => {
            const camera = Workspace.CurrentCamera;
            if (!camera) return 1;
            return camera.ViewportSize.X / 1920;
        };

        const ScaleStroke = (stroke: UIStroke) => {
            if (!baseThickness.has(stroke)) {
                stroke.AddTag(`Scaled`);
                baseThickness.set(stroke, stroke.Thickness);
            }

            stroke.Thickness = baseThickness.get(stroke)! * GetScaleFactor();
        };

        const RescaleAll = () => {
            for (const [stroke, base] of baseThickness) {
                stroke.Thickness = base * GetScaleFactor();
            }
        };

        const AutoScale = () => {
            for (const gui of playerInterface.GetDescendants()) {
                if (gui.IsA("UIStroke") && !gui.HasTag(`Scaled`)) {
                    ScaleStroke(gui);
                }
            }
        };

        AutoScale();

        janitor.Add(
            playerInterface.DescendantAdded.Connect((descendant) => {
                if (descendant.IsA("UIStroke")) {
                    ScaleStroke(descendant);
                }
            }),
            `Disconnect`,
            `AutoScaleUIStroke`,
        );
        const HookCamera = (camera: Camera) => {
            janitor.Add(
                camera.GetPropertyChangedSignal("ViewportSize").Connect(() => {
                    RescaleAll();
                }),
                `Disconnect`,
                `ViewportSizeChanged`,
            );
        };

        if (Workspace.CurrentCamera) {
            HookCamera(Workspace.CurrentCamera);
        }
        janitor.Add(
            Workspace.GetPropertyChangedSignal("CurrentCamera").Connect(() => {
                if (Workspace.CurrentCamera) {
                    HookCamera(Workspace.CurrentCamera);
                    RescaleAll();
                }
            }),
            `Disconnect`,
            `CurrentCameraChanged`,
        );
    }
}
