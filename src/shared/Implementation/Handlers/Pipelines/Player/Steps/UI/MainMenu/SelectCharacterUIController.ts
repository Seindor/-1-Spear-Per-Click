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

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class SelectCharacterUIController {
    public Id = `SelectCharacterUIController`;

    public ctx: PipelineContext<ClientPlayerContext>;
    public player: Player;
    public stringUserId: string;
    public playerInterface: IPlayerInterface;
    public mainMenu: IMainMenu;
    public _janitor = janitorAPI.Create(`UI`, `SelectCharacterUIController`);

    public playerData!: PlayerData;
    public playerSlots!: ISlotData[];

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
        this.mainMenu.CharacterSlots.UIScale.Scale = 1;
        this.mainMenu.CharacterSlots.Visible = false;

        this.UpdatePlayerData();

        this.SetupButtons();

        ctx.MarkLoaded(this.Id);
    }

    public WaitForPlayerData(): Promise<void> {
        return new Promise((resolve) => {
            this._janitor.Add(
                task.spawn(() => {
                    while (this.playerData === undefined || this.playerSlots === undefined) {
                        task.wait(0.1);
                    }

                    resolve();
                }),
                true,
                `WaitDataLoading`,
            );
        });
    }

    public UpdatePlayerData() {
        let playerDataAtom = clientAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`);

        if (playerDataAtom) {
            clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
                this.stringUserId,
                `SelectCharacterUIController/UpdatePlayerdata`,
                `PlayerData`,
                `${this.stringUserId}`,
                (data) => {
                    this.playerData = data!;
                    this.SetupSlots();
                },
            );

            clientAtomAPI.Subscribe<Record<string, PlayerData>, ISlotData[]>(
                this.stringUserId,
                `SelectCharacterUIController/UpdatePlayerSlots`,
                `PlayerData`,
                `${this.stringUserId}/slots`,
                (slots) => {
                    this.playerSlots = slots ?? [];
                    this.SetupSlots();
                },
            );
        }
    }

    public ClearSlots() {
        const characterSlots = this.mainMenu.CharacterSlots;
        const slotsContainer = characterSlots.Container;

        for (const slot of slotsContainer.GetChildren()) {
            if (slot.IsA(`GuiButton`)) {
                uiWrapperAPI.Remove(slot);
                slot.Destroy();
            }
        }
    }

    public async SetupSlots() {
        await this.WaitForPlayerData();

        this.ClearSlots();

        for (const [index, slot] of ipairs(this.playerSlots)) {
            this.SetupSlotVisual(index, slot);
        }

        this.SetupCreateNewSlotButton();
    }

    public SetupGhoulSlotVisual(
        index: number,
        slot: ISlotData,
        slotButton: UIButtonAggregate<ICharacterSlotTemplate>,
    ) {
        let slotButtonInstance = slotButton.instance as ICharacterSlotTemplate;

        slotButtonInstance.CurrentSlotFrame.Side.CCGGradient.Enabled = false;
        slotButtonInstance.CurrentSlotFrame.Side.GhoulGradient.Enabled = true;
        slotButtonInstance.CurrentSlotFrame.Class.Text = `WIP`;
        slotButtonInstance.CurrentSlotFrame.Visible = true;
    }

    public SetupHumanSlotVisual(
        index: number,
        slot: ISlotData,
        slotButton: UIButtonAggregate<ICharacterSlotTemplate>,
    ) {
        let slotButtonInstance = slotButton.instance as ICharacterSlotTemplate;

        slotButtonInstance.CurrentSlotFrame.Side.GhoulGradient.Enabled = false;
        slotButtonInstance.CurrentSlotFrame.Side.CCGGradient.Enabled = true;
        slotButtonInstance.CurrentSlotFrame.Class.Text = `WIP`;
        slotButtonInstance.CurrentSlotFrame.Visible = true;
    }

    public SetupEmtySlotVisual(
        index: number,
        slot: ISlotData,
        slotButton: UIButtonAggregate<ICharacterSlotTemplate>,
    ) {
        let slotButtonInstance = slotButton.instance as ICharacterSlotTemplate;
        slotButtonInstance.EmptySlotFrame.Visible = true;
    }

    public SelectSlotVisual(
        index: number,
        slot: ISlotData,
        slotButton: UIButtonAggregate<ICharacterSlotTemplate>,
    ) {
        if (!slot.slotInfo.setuped) {
            this.SetupEmtySlotVisual(index, slot, slotButton);
            return;
        }

        if (slot.character.profile.race === `Ghoul`) {
            this.SetupGhoulSlotVisual(index, slot, slotButton);
        } else {
            this.SetupHumanSlotVisual(index, slot, slotButton);
        }
    }

    public SetupSlotVisual(index: number, slot: ISlotData) {
        let container = this.mainMenu.CharacterSlots.Container;

        if (!this.playerData) return;

        let slotButton = uiWrapperAPI.Create(
            UITemplates.characterCreationTemplates.CharacterSlot(),
        );
        let slotButtonInstance = slotButton.instance as ICharacterSlotTemplate;

        slotButtonInstance.NewSlotFrame.Visible = false;
        slotButtonInstance.CurrentSlotFrame.SlotName.Text = `${slot.character.profile.name} ${slot.character.profile.clan}`;

        if (this.playerData.currentSlot === slot.slotInfo.slotId) {
            slotButtonInstance.CurrentSlotFrame.SelectedTitle.Visible = true;
        }

        this.SelectSlotVisual(index, slot, slotButton);

        slotButton.AddCallback(`Activated`, `SelectSlot`, () => {
            if ((slotButton.miscData.get(`Cooldown`) as boolean) !== true) {
                if (!slot.slotInfo.setuped) {
                    this.Hide(false);
                    this.buses.uiBus.Fire(
                        `CreateCharacterUIController/CreateSlot`,
                        undefined,
                        undefined,
                        slot.slotInfo.slotId,
                    );
                } else {
                    ClientSignals.SelectCharacterSlot(slot.slotInfo.slotId);
                }

                slotButton.miscData.set(`Cooldown`, true);
                slotButton._Janitor.Add(
                    task.delay(1, () => {
                        slotButton.miscData.set(`Cooldown`, false);
                    }),
                    true,
                    `RemoveActivatedCooldown`,
                );
            }
        });

        slotButtonInstance.Visible = true;
        slotButtonInstance.LayoutOrder = index;
        slotButtonInstance.Parent = container;
    }

    public Show(closeMenu?: boolean) {
        let characterSlotsFrame = uiWrapperAPI.Create(this.mainMenu.CharacterSlots);

        characterSlotsFrame.instance.Visible = true;
        characterSlotsFrame.miscData.set(`Shown`, true);
        characterSlotsFrame.EmitEffect([
            {
                Name: `SpringEffect`,
                Params: {
                    duration: 0.25,
                    damping: 5,
                    frequency: 10,
                    amplitude: 0.15,
                    startScale: 0,
                    targetScale: 1,
                },
            },
        ]);

        if (closeMenu === true) {
            this.buses.uiBus.Fire(`MainMenu/ShowButtons`, undefined, false, false);
        }

        this.SetupSlots();
    }

    public Hide(openMenu?: boolean) {
        let characterSlotsFrame = uiWrapperAPI.Create(this.mainMenu.CharacterSlots);

        characterSlotsFrame.miscData.set(`Shown`, false);
        characterSlotsFrame.EmitEffect([
            {
                Name: `SpringEffect`,
                Params: {
                    duration: 0.25,
                    damping: 10,
                    frequency: 8,
                    amplitude: 0.05,
                    startScale: 1,
                    targetScale: 0,
                },
            },
        ]);

        if (openMenu === true) {
            this.buses.uiBus.Fire(`MainMenu/ShowButtons`, undefined, false, true);
        }
    }

    public SetupSelectedCharacterButton() {
        let selectedCharacterButton = uiWrapperAPI.Create(
            this.mainMenu.ButtonsContainer.SelectCharacter,
        );

        selectedCharacterButton.AddCallback(`Activated`, `OpenCharacterSlots`, () => {
            this.Show(true);
        });
    }

    public SetupCreateNewSlotButton() {
        let characterSlots = this.mainMenu.CharacterSlots;

        let createNewSlotButton = uiWrapperAPI.Create(
            UITemplates.characterCreationTemplates.CharacterSlot(),
        );

        let createNewSlotInstance = createNewSlotButton.instance;

        createNewSlotButton.AddCallback(`Activated`, `CreateNewSlot`, () => {
            //wip
        });

        createNewSlotInstance.LayoutOrder = 999999;
        createNewSlotInstance.NewSlotFrame.Visible = true;
        createNewSlotInstance.Parent = characterSlots.Container;
    }

    public SetupBackButton() {
        let backButton = uiWrapperAPI.Create(this.mainMenu.CharacterSlots.BackButton);

        backButton.AddCallback(`Activated`, `Back`, () => {
            this.ClearSlots();
            this.Hide(true);
        });
    }

    public SetupButtons() {
        this.SetupSelectedCharacterButton();
        this.SetupBackButton();
    }
}
