import { SolverPack } from "../Aggregates/SolverPack";

export class SolverService {
    public packs = new Map<string, SolverPack>();

    public NewPack(packName: string, overwrite?: boolean): SolverPack {
        if (this.packs.has(packName)) {
            if (overwrite) {
                this.RemovePack(packName);
            } else {
                return this.packs.get(packName)!;
            }
        }

        const pack = new SolverPack(packName);
        this.packs.set(packName, pack);

        return pack;
    }

    public GetPack(packName: string): SolverPack | undefined {
        if (this.packs.has(packName)) {
            return this.packs.get(packName);
        }

        warn(`Cannot find pack "${packName}" to return.`);
        return;
    }

    public RemovePack(packName: string) {
        if (this.packs.has(packName)) {
            const pack = this.packs.get(packName)!;

            pack.Destroy();
            this.packs.delete(packName);

            return;
        }

        warn(`Cannot find pack "${packName}" to remove.`);
    }
}
