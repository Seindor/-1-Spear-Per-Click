import { SolverPack } from "../Aggregates/SolverPack";
import { SolverService } from "../Services/SolverService";

export class SolverAPI {
    public service = new SolverService();

    /**
     * Создаёт (или возвращает существующий) пак солверов по имени.
     * Обычно packName — это что-то уникальное на игрока/сущность,
     * например `Player_${userId}` или сам `Player.Name`.
     */
    public NewPack(packName: string, overwrite?: boolean): SolverPack {
        return this.service.NewPack(packName, overwrite);
    }

    public GetPack(packName: string): SolverPack | undefined {
        return this.service.GetPack(packName);
    }

    public RemovePack(packName: string) {
        this.service.RemovePack(packName);
    }
}
