import { Players } from "@rbxts/services";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { IPlayer_Interface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import type { Replicators } from "../../Init/LoadReplicatorsStep/Replicators";

import { AbbreviateModule } from "shared/Utilities/AbbreviateModule";

import { PlayerData } from "shared/Types/Database/PlayerData";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class UIStrengthController {
    public id = `UIStrengthController`;

    public ctx: PipelineContext<ClientPlayerContext>;
    public player: Player;
    public playerInterface: IPlayer_Interface;

    public playerData!: PlayerData;
    public lasStrength = 0;

    public _janitor = janitorAPI.Create(`UI`, `${this.id}`);

    constructor(ctx: PipelineContext<ClientPlayerContext>, playerInterface: IPlayer_Interface) {
        this.ctx = ctx;
        this.playerInterface = playerInterface;
        this.player = Players.GetPlayerByUserId(tonumber(ctx.Data.id)!)!;

        ctx.MarkLaunched(this.id);

        this.Init();
    }

    public Init() {
        this.WaitForPlayerData();
        this.InitSubscribers();

        this.SetStrength();
    }

    private WaitForPlayerData() {
        while (!clientAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`)) {
            task.wait(0.1);
        }

        let replicators = this.ctx.Get(`LoadReplicatorsStep/Replicators`) as
            | undefined
            | Replicators;

        while (!replicators) {
            replicators = this.ctx.Get(`LoadReplicatorsStep/Replicators`) as Replicators;
            task.wait(0.1);
        }

        while (!replicators.playerData) {
            task.wait(0.1);
        }

        this.playerData = replicators.playerData;
    }

    public InitSubscribers() {
        let playerDataAtom = clientAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`);

        if (playerDataAtom) {
            clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
                this.ctx.Data.id,
                `${this.id}/UpdatePlayerdata`,
                `PlayerData`,
                `${this.ctx.Data.id}`,
                (data) => {
                    this.playerData = data!;
                    this.SetStrength();
                },
            );
        }
    }

    public SetStrength() {
        let mainFrame = this.playerInterface.Main_Frame;
        let statTitle = mainFrame.Stat_Title;

        statTitle.Text = `${AbbreviateModule.Currency(this.playerData.progression.stats.strength, 2)} Stat`;
    }
}
