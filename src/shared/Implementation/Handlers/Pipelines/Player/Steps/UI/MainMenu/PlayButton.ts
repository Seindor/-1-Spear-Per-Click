import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import { IMainMenu } from "shared/Types/Gameplay/UI/MainMenu";

import { ISlotData, PlayerData } from "shared/Types/Database/PlayerData";

import { UIButtonAggregate } from "shared/Domain/UIWrapper/Aggregates/UIButtonAggregate";

import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";

import { UITemplates } from "shared/Implementation/Entities/Templates/UI";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";

import { ICharacterSlotTemplate } from "shared/Implementation/Entities/Templates/UI/Data/CharacterCreation/CharacterSlotTemplate";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { IButtonsContainer } from "shared/Types/Gameplay/UI/MainMenu/IButtonsContainer";

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class PlayButtonUIController {
    public Id = `PlayButtonUIController`;

    public ctx: PipelineContext<ClientPlayerContext>;
    public player: Player;
    public stringUserId: string;
    public playerInterface: IPlayerInterface;
    public mainMenu: IMainMenu;
    public _janitor = janitorAPI.Create(`UI`, `SelectCharacterUIController`);

    public playerData!: PlayerData;

    public buses: {
        uiBus: EventBusAggregate;
    };

    constructor(ctx: PipelineContext<ClientPlayerContext>, playerInterface: IPlayerInterface) {
        this.ctx = ctx;
        this.player = ctx.Data.player;
        this.stringUserId = ctx.Data.id;
        this.playerInterface = playerInterface;
        this.mainMenu = playerInterface.WaitForChild(`MainMenu`) as IMainMenu;

        this.buses = {
            uiBus: eventBusAPI.New(ctx.Data.id, `UI`),
        };

        this.Init(ctx);
    }

    public Init(ctx: PipelineContext<ClientPlayerContext>) {
        this.UpdatePlayerData();
        this.SetupPlayButton();

        ctx.MarkLoaded(this.Id);
    }

    public UpdatePlayerData() {
        let playerDataAtom = clientAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`);

        if (playerDataAtom) {
            clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
                this.stringUserId,
                `PlayButtonUIController/UpdatePlayerdata`,
                `PlayerData`,
                `${this.stringUserId}`,
                (data) => {
                    this.playerData = data!;
                    this.SetupPlayButton();
                },
            );
        }
    }

    public WaitForPlayerData(): Promise<void> {
        return new Promise((resolve) => {
            this._janitor.Add(
                task.spawn(() => {
                    while (this.playerData === undefined) {
                        task.wait(0.1);
                    }

                    resolve();
                }),
                true,
                `WaitDataLoading`,
            );
        });
    }

    public async SetupPlayButton() {
        let buttonsContainer = this.mainMenu.WaitForChild(`ButtonsContainer`) as IButtonsContainer;
        let playButton = uiWrapperAPI.Create(buttonsContainer.Play);
        let playButtonInstance = playButton.instance;

        await this.WaitForPlayerData();

        if (this.playerData.currentSlot === `none`) {
            playButtonInstance.Visible = false;
            return;
        }

        playButtonInstance.Visible = true;
        playButtonInstance.Active = true;

        playButton.AddCallback(`Activated`, `Play`, () => {
            this.buses.uiBus.Fire(`MainMenu/ShowButtons`, undefined, undefined, false, false);
            this.buses.uiBus.Fire(`ServerList/Show`, undefined, undefined, true);
        });
    }
}
