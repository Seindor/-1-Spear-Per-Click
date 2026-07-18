import type { EasingDirection, EasingStyle } from "shared/Utilities/TweenMath";

export interface AnimatorProperties {
    Character: Model;
    Animator?: Animator;
    AnimatorName?: string;
}

export type AxisDurations = [number?, number?, number?];

export type MotorMoveDurations = {
    Position?: AxisDurations;
    Rotation?: AxisDurations;
};

export const R6_MOTOR_NAMES = [
    "RootJoint",
    "Neck",
    "Right Shoulder",
    "Left Shoulder",
    "Right Hip",
    "Left Hip",
] as const;

export const R15_MOTOR_NAMES = [
    "Root",
    "Waist",
    "Neck",
    "LeftShoulder",
    "RightShoulder",
    "LeftElbow",
    "RightElbow",
    "LeftWrist",
    "RightWrist",
    "LeftHip",
    "RightHip",
    "LeftKnee",
    "RightKnee",
    "LeftAnkle",
    "RightAnkle",
] as const;

export type R6MotorName = (typeof R6_MOTOR_NAMES)[number];
export type R15MotorName = (typeof R15_MOTOR_NAMES)[number];

export type DefaultMotorName = R6MotorName | R15MotorName;
export type MotorName = DefaultMotorName | (string & {});

export type MotorOffsetState = {
    motor: Motor6D;
    baseC0: CFrame;
    baseOffset: CFrame;
    currentOffset: CFrame;
    activeConnection?: RBXScriptConnection;
    activeMoveName?: string;
};

export type ActiveMotorMove = {
    name: string;
    motorName: MotorName;
    state: MotorOffsetState;
};

export type StopOptions = {
    allowPartialMatch?: boolean;
    findAll?: boolean;
};

export type MoveMotorOptions = {
    style?: EasingStyle;
    direction?: EasingDirection;
    durations?: MotorMoveDurations;
    moveName?: string;
};

export type SetMotorOffsetOptions = {
    moveName?: string;
};
