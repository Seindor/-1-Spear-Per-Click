// ─────────────────────────────────────────────
//  Hitbox / Components / OBBIntersection.ts
//
//  Проверка пересечения двух ориентированных боксов (Oriented Bounding Box)
//  по теореме о разделяющей оси (Separating Axis Theorem).
//
//  Нужен для того, чтобы проверять "пересекался бы хитбокс с целью, если бы
//  цель стояла в СВОЕЙ ЗАПИСАННОЙ ИСТОРИЧЕСКОЙ позиции" — то есть без того,
//  чтобы цель реально была там прямо сейчас в físической симуляции Roblox.
//  Workspace:GetPartBoundsInBox работает только по РЕАЛЬНОМУ состоянию мира,
//  поэтому для гипотетической (rewind) позиции нужен свой геометрический тест.
// ─────────────────────────────────────────────

export type OBB = {
    cframe: CFrame;
    halfSize: Vector3;
};

/**
 * true, если боксы a и b пересекаются (или касаются).
 * Классический 3D SAT: 3 оси граней A + 3 оси граней B + 9 векторных
 * произведений рёбер A×B = 15 потенциальных разделяющих осей.
 * Если хотя бы одна ось разделяет боксы — пересечения нет.
 */
export function OBBOverlap(a: OBB, b: OBB): boolean {
    const aAxes = [a.cframe.XVector, a.cframe.YVector, a.cframe.ZVector];
    const bAxes = [b.cframe.XVector, b.cframe.YVector, b.cframe.ZVector];

    const translation = b.cframe.Position.sub(a.cframe.Position);

    const axes: Vector3[] = [...aAxes, ...bAxes];

    for (const axisA of aAxes) {
        for (const axisB of bAxes) {
            const cross = axisA.Cross(axisB);
            // Параллельные рёбра дают нулевой вектор — такая ось не несёт информации,
            // пропускаем её, иначе Unit на нулевом векторе даст NaN.
            if (cross.Magnitude > 1e-6) {
                axes.push(cross.Unit);
            }
        }
    }

    for (const axis of axes) {
        if (!OverlapsOnAxis(axis, a, aAxes, b, bAxes, translation)) {
            return false;
        }
    }

    return true;
}

function OverlapsOnAxis(
    axis: Vector3,
    a: OBB,
    aAxes: Vector3[],
    b: OBB,
    bAxes: Vector3[],
    translation: Vector3,
): boolean {
    const radiusA =
        math.abs(aAxes[0].Dot(axis)) * a.halfSize.X +
        math.abs(aAxes[1].Dot(axis)) * a.halfSize.Y +
        math.abs(aAxes[2].Dot(axis)) * a.halfSize.Z;

    const radiusB =
        math.abs(bAxes[0].Dot(axis)) * b.halfSize.X +
        math.abs(bAxes[1].Dot(axis)) * b.halfSize.Y +
        math.abs(bAxes[2].Dot(axis)) * b.halfSize.Z;

    const distance = math.abs(translation.Dot(axis));

    return distance <= radiusA + radiusB;
}
