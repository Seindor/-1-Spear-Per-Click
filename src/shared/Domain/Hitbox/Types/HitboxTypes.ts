export type HitboxShape = "Block" | "Ball" | "Cylinder";

export type HitboxPrediction = {
    enabled: boolean;

    // Время в секундах, на которое откатываем ЗАПИСАННЫЕ позиции трекнутых
    // партов при проверке (задержка атакующего игрока).
    // Передаётся как: Workspace.GetServerTimeNow() на клиенте в момент удара
    //   → сервер считает rewindTime = serverNow - clientTimestamp.
    //
    // ВАЖНО: хитбокс проверяет ОБЕ позиции цели одновременно —
    //   1) её РЕАЛЬНУЮ текущую позицию (обычная физическая проверка)
    //   2) её ЗАПИСАННУЮ историческую позицию (rewind, только для partов,
    //      затреканных через HitboxAPI.TrackPart)
    // Если цель попадает хотя бы в одну из двух проверок — засчитывается хит.
    // Это защищает и атакующего (компенсация его пинга), и цель
    // (она не получит урон "из ниоткуда", если давно вышла из зоны атаки
    // и по факту сейчас там пусто — если хотя бы одна из проверок валидна,
    // формально "промежуток" между её текущей и прошлой позицией был перекрыт).
    rewindTime?: number;

    // На сколько секунд вперёд двигаем позицию атакующего (по его velocity).
    leadTime?: number;

    // Множитель расширения хитбокса ПРИ ИСТОРИЧЕСКОЙ проверке, если цель
    // быстро двигалась (сглаживает погрешность между снапшотами). 1.0 = без расширения.
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

    onHit?: (target: BasePart) => void;
    onHitEnd?: (target: BasePart) => void;
    hitCheck?: (target: BasePart) => boolean;
};
