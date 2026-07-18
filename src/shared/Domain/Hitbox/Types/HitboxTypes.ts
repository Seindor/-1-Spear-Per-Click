export type HitboxShape = "Block" | "Ball" | "Cylinder";

export type HitboxPrediction = {
    enabled: boolean;

    // время в секундах на которое откатываем цели назад
    // передаётся как: Workspace.GetServerTimeNow() на клиенте → сервер считает serverNow - clientTime
    rewindTime?: number;

    // на сколько секунд вперёд двигаем позицию атакующего
    leadTime?: number;

    // множитель расширения хитбокса если цель движется (1.0 = без расширения)
    movementForgiveness?: number;
};

export type HitboxConfig = {
    size: Vector3;
    offset?: CFrame;

    lifetime: number;
    hitCooldown: number;

    shape?: HitboxShape;
    prediction?: HitboxPrediction;

    filterType?: Enum.RaycastFilterType;
    filter?: Instance[];

    debug?: boolean;

    onHit?: (target: Instance) => void;
    onHitEnd?: (target: Instance) => void;
    hitCheck?: (target: Instance) => boolean;
};
