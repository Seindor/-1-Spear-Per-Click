export class BasePartHelper {
    public CreatePart(Size?: Vector3) {
        const part = new Instance("Part");
        part.Size = Size ?? new Vector3(4, 4, 4);
        part.CanCollide = false;
        part.CanQuery = false;
        part.CanTouch = false;
        part.Massless = true;
        return part;
    }
    public Weld(part0: BasePart, part1: BasePart) {
        const weld = new Instance("Weld");
        weld.Part0 = part0;
        weld.Part1 = part1;
        weld.Parent = part1;
        return weld;
    }
    public WeldConstraint(part0: BasePart, part1: BasePart) {
        const weld = new Instance("WeldConstraint");
        weld.Part0 = part0;
        weld.Part1 = part1;
        weld.Parent = part1;
        return weld;
    }
}
