export interface MovementAnimationTarget {
    readonly character: Model;
    readonly rootPart: BasePart;
    readonly humanoid: Humanoid;

    readonly animator?: Animator;

    readonly animationsPack?: Folder;
}
