import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import { IMainMenu } from "shared/Types/Gameplay/UI/MainMenu";

import { ISlotData, PlayerData } from "shared/Types/Database/PlayerData";

import { UIButtonAggregate } from "shared/Domain/UIWrapper/Aggregates/UIButtonAggregate";
import { UIFrameAggregate } from "shared/Domain/UIWrapper/Aggregates/UIFrameAggregate";

import EventBusAggregate from "shared/Domain/EventBus/Aggregates/EventBusAggregate";

import { UITemplates } from "shared/Implementation/Entities/Templates/UI";

import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";
import { ClientPlayerContext } from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";

import { ICharacterSlotTemplate } from "shared/Implementation/Entities/Templates/UI/Data/CharacterCreation/CharacterSlotTemplate";
import { IUIFrameAggregate } from "shared/Domain/UIWrapper/Types/TypedAggregates";
import { Gender, GenderIcons, GenderLayoutOrders } from "shared/Types/Database/Gender";
import { ICharacterCreationButtonTemplate } from "shared/Implementation/Entities/Templates/UI/Data/CharacterCreation/CharacterCreationButtonTemplate";
import { Race, RaceIcons, RaceLayoutOrders } from "shared/Types/Database/Race";

import { ClientFunctions, ClientSignals } from "shared/Implementation/Entities/ClientSignals";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";

const sharedScope = CompositionRootShared.createScope();

const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);
const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const janitorAPI = sharedScope.resolve(SharedRegistry.Singletons.API.JanitorAPI);
const clientAtomAPI = sharedScope.resolve(SharedRegistry.Singletons.API.ClientAtomAPI);

export class CreateCharacterUIController {
    public Id = `CreateCharacterUIController`;

    public ctx: PipelineContext<ClientPlayerContext>;
    public player: Player;
    public stringUserId: string;
    public playerInterface: IPlayerInterface;
    public mainMenu: IMainMenu;
    public _janitor = janitorAPI.Create(`UI`, `CreateCharacterUIController`);

    public slotData = {
        gender: `Gender` as Gender | `Gender`,
        race: `Race` as Race | `Race`,
        name: undefined as string | undefined,
    };

    public playerData!: PlayerData;

    public buses: {
        uiBus: EventBusAggregate;
        crateCharacterUIControllerBus: EventBusAggregate;
    };

    constructor(ctx: PipelineContext<ClientPlayerContext>, playerInterface: IPlayerInterface) {
        this.ctx = ctx;
        this.player = ctx.Data.player;
        this.stringUserId = ctx.Data.id;
        this.playerInterface = playerInterface;
        this.mainMenu = playerInterface.WaitForChild(`MainMenu`) as IMainMenu;

        this.buses = {
            uiBus: eventBusAPI.New(ctx.Data.id, `UI`),
            crateCharacterUIControllerBus: eventBusAPI.New(
                ctx.Data.id,
                `CrateCharacterUIControllerBus`,
            ),
        };

        this.Init(ctx);
    }

    public Init(ctx: PipelineContext<ClientPlayerContext>) {
        this.UpdatePlayerData();
        ctx.MarkLoaded(this.Id);
    }

    private WaitForPlayerData() {
        this._janitor.Add(
            task.spawn(() => {
                while (!this.playerData) {
                    task.wait(0.1);
                }
            }),
            true,
            `WaitDataLoading`,
        );
    }

    public UpdatePlayerData() {
        let playerDataAtom = clientAtomAPI.GetAtom<Record<string, PlayerData>>(`PlayerData`);

        if (playerDataAtom) {
            clientAtomAPI.Subscribe<Record<string, PlayerData>, PlayerData>(
                this.stringUserId,
                `CreateCharacterUIController/UpdatePlayerdata`,
                `PlayerData`,
                `${this.stringUserId}`,
                (data) => {
                    this.playerData = data!;
                },
            );
        }

        this.WaitForPlayerData();
    }

    public ClearContainer(container: ScrollingFrame) {
        for (const button of container.GetChildren()) {
            if (button.IsA(`GuiObject`)) {
                uiWrapperAPI.Remove(button);
            }
        }
    }

    public SetupGenders(animation?: boolean) {
        let characterCreation = this.mainMenu.CharacterCreation;
        let selectGender = characterCreation.SelectGender;
        let gendersContainer = selectGender.ContainerBackground.Container;

        this.ClearContainer(gendersContainer);

        for (const [index, genderIcon] of pairs(GenderIcons)) {
            let genderButton = uiWrapperAPI.Create(
                UITemplates.characterCreationTemplates.CreateCharacterCreationButton(),
            );
            let genderButtonInstance = genderButton.instance as ICharacterCreationButtonTemplate;

            genderButtonInstance.Icon.Image = genderIcon;

            const setupHoverCallbacks = () => {
                genderButton.AddCallback(`MouseEnter`, `HighlightButton`, () => {
                    genderButtonInstance.Icon.ImageTransparency = 0;
                    genderButtonInstance.UIScale.Scale = 1.1;

                    characterCreation.GenderTitle.UIScale.Scale = 1.1;
                    characterCreation.GenderTitle.Title.Text = index;
                });

                genderButton.AddCallback(`MouseLeave`, `HighlightButton`, () => {
                    genderButtonInstance.Icon.ImageTransparency = 0.5;
                    genderButtonInstance.UIScale.Scale = 1;

                    if (this.slotData.gender === `Gender`) {
                        characterCreation.GenderTitle.UIScale.Scale = 1;
                    }

                    characterCreation.GenderTitle.Title.Text = this.slotData.gender;
                });
            };
            const removeHoverCallbacks = () => {
                genderButton.RemoveCallback(`MouseEnter`, `HighlightButton`);
                genderButton.RemoveCallback(`MouseLeave`, `HighlightButton`);
            };

            setupHoverCallbacks();

            genderButton.AddCallback(`Activated`, `SelectGender`, () => {
                removeHoverCallbacks();

                if (this.slotData.gender === index) {
                    characterCreation.GenderTitle.Title.Text = `Gender`;

                    genderButtonInstance.Icon.ImageTransparency = 0.5;
                    genderButtonInstance.UIScale.Scale = 1;

                    this.slotData.gender = `Gender`;

                    this.buses.crateCharacterUIControllerBus.Fire(`GenderChanged`);
                    this.buses.crateCharacterUIControllerBus.Fire(`UpdateSlotData`);
                } else {
                    genderButtonInstance.Icon.ImageTransparency = 0;
                    genderButtonInstance.UIScale.Scale = 1.1;

                    characterCreation.GenderTitle.UIScale.Scale = 1.1;
                    characterCreation.GenderTitle.Title.Text = index;

                    this.slotData.gender = index;

                    this.buses.crateCharacterUIControllerBus.Fire(`GenderChanged`);
                    this.buses.crateCharacterUIControllerBus.Fire(`UpdateSlotData`);
                }
            });

            this.buses.crateCharacterUIControllerBus.Subscribe(
                `GenderChanged`,
                () => {
                    if (this.slotData.gender !== index) {
                        characterCreation.GenderTitle.Title.Text = this.slotData.gender;

                        genderButtonInstance.Icon.ImageTransparency = 0.5;
                        genderButtonInstance.UIScale.Scale = 1;

                        setupHoverCallbacks();
                    }
                },
                undefined,
                `SetupGenders/${index}`,
            );

            genderButtonInstance.LayoutOrder = GenderLayoutOrders[index];
            genderButtonInstance.Visible = true;
            genderButtonInstance.Parent = gendersContainer;
        }
    }

    public SetupRaces(animation?: boolean) {
        let characterCreation = this.mainMenu.CharacterCreation;
        let selectRace = characterCreation.SelectRace;
        let racesContainer = selectRace.ContainerBackground.Container;

        this.ClearContainer(racesContainer);

        for (const [index, raceName] of pairs(this.playerData.availableRaces)) {
            let raceButton = uiWrapperAPI.Create(
                UITemplates.characterCreationTemplates.CreateCharacterCreationButton(),
            );

            let raceButtonInstance = raceButton.instance;

            raceButtonInstance.Icon.Image = RaceIcons[raceName];

            const setupHoverCallbacks = () => {
                raceButton.AddCallback(`MouseEnter`, `HighlightButton`, () => {
                    raceButtonInstance.Icon.ImageTransparency = 0;
                    raceButtonInstance.UIScale.Scale = 1.1;

                    characterCreation.RaceTitle.UIScale.Scale = 1.1;
                    characterCreation.RaceTitle.Title.Text = raceName;
                });

                raceButton.AddCallback(`MouseLeave`, `HighlightButton`, () => {
                    raceButtonInstance.Icon.ImageTransparency = 0.5;
                    raceButtonInstance.UIScale.Scale = 1;

                    if (this.slotData.race === `Race`) {
                        characterCreation.RaceTitle.UIScale.Scale = 1;
                    }

                    characterCreation.RaceTitle.Title.Text = this.slotData.race;
                });
            };

            const removeHoverCallbacks = () => {
                raceButton.RemoveCallback(`MouseEnter`, `HighlightButton`);
                raceButton.RemoveCallback(`MouseLeave`, `HighlightButton`);
            };

            setupHoverCallbacks();

            raceButton.AddCallback(`Activated`, `SelectRace`, () => {
                removeHoverCallbacks();

                if (this.slotData.race === raceName) {
                    characterCreation.RaceTitle.Title.Text = `Race`;

                    raceButtonInstance.Icon.ImageTransparency = 0.5;
                    raceButtonInstance.UIScale.Scale = 1;

                    this.slotData.race = `Race`;

                    this.buses.crateCharacterUIControllerBus.Fire(`RaceChanged`);
                    this.buses.crateCharacterUIControllerBus.Fire(`UpdateSlotData`);
                } else {
                    raceButtonInstance.Icon.ImageTransparency = 0;
                    raceButtonInstance.UIScale.Scale = 1.1;

                    characterCreation.RaceTitle.UIScale.Scale = 1.1;
                    characterCreation.RaceTitle.Title.Text = raceName;

                    this.slotData.race = raceName;

                    this.buses.crateCharacterUIControllerBus.Fire(`RaceChanged`);
                    this.buses.crateCharacterUIControllerBus.Fire(`UpdateSlotData`);
                }
            });

            this.buses.crateCharacterUIControllerBus.Subscribe(
                `RaceChanged`,
                () => {
                    if (this.slotData.race !== raceName) {
                        characterCreation.RaceTitle.Title.Text = this.slotData.race;

                        raceButtonInstance.Icon.ImageTransparency = 0.5;
                        raceButtonInstance.UIScale.Scale = 1;

                        setupHoverCallbacks();
                    }
                },
                undefined,
                `SetupRaces/${raceName}`,
            );

            raceButtonInstance.LayoutOrder = RaceLayoutOrders[raceName];
            raceButtonInstance.Visible = true;
            raceButtonInstance.Parent = racesContainer;
        }
    }

    public IncorrectName(errorText: string) {
        let characterCreation = this.mainMenu.CharacterCreation;
        let enterName = characterCreation.EnterName;
        let textBox = uiWrapperAPI.Create(enterName.TextBox);
        let textBoxInstance = textBox.instance;

        textBoxInstance.Interactable = false;
        textBoxInstance.Active = false;
        textBoxInstance.TextEditable = false;
        textBoxInstance.Text = errorText;
        this.slotData.name = undefined;

        textBox._Janitor.Add(
            task.delay(3, () => {
                textBoxInstance.Text = `Enter Name`;
                textBoxInstance.Interactable = true;
                textBoxInstance.Active = true;
                textBoxInstance.TextEditable = true;
            }),
            true,
            `RestoreText`,
        );
    }

    public SetupEnterName() {
        let characterCreation = this.mainMenu.CharacterCreation;
        let enterName = characterCreation.EnterName;
        let textBox = uiWrapperAPI.Create(enterName.TextBox);
        let textBoxInstance = textBox.instance;

        this._janitor.Add(
            textBoxInstance.FocusLost.Connect((enterPressed) => {
                this.slotData.name = textBoxInstance.Text;
                this.buses.crateCharacterUIControllerBus.Fire(`UpdateSlotData`);
            }),
            `Disconnect`,
            `EnterName/FocusLost`,
        );
    }

    private async getFilteredSlotName(): Promise<{ filtered: boolean; name: string }> {
        try {
            return await ClientFunctions.GetFilteredSlotName.invoke(this.slotData.name as string);
        } catch (err) {
            warn("[GetFilteredSlotName] Failed:", err);

            return {
                filtered: false,
                name: this.slotData.name as string,
            };
        }
    }

    public SetupConfirmButton(slotId: string) {
        let characterCreation = this.mainMenu.CharacterCreation;
        let confirmButton = uiWrapperAPI.Create(characterCreation.ConfirmButton);
        let confirmButtonInstance = confirmButton.instance;

        confirmButton.AddCallback(`Activated`, `SetupSlot`, () => {
            confirmButton.miscData.set(`Cooldown`, true);
            confirmButton._Janitor.Add(
                task.delay(1, () => {
                    confirmButton.miscData.set(`Cooldown`, false);
                }),
                true,
                `RemoveActivatedCooldown`,
            );

            if ((confirmButton.miscData.get(`AllowToConfirm`) as boolean) === true) {
                ClientSignals.SetupSlot.fire(
                    slotId,
                    this.slotData.name!,
                    this.slotData.gender as Gender,
                    this.slotData.race as Race,
                );

                this.Hide();
            }
        });

        this.buses.crateCharacterUIControllerBus.Subscribe(
            `UpdateSlotData`,
            async () => {
                confirmButtonInstance.SuccsessGradient.Enabled = false;
                confirmButtonInstance.FailedGradient.Enabled = true;
                confirmButtonInstance.Title.TextTransparency = 0.5;

                if (this.slotData.gender === `Gender`) {
                    confirmButton.miscData.set(`AllowToConfirm`, false);
                    confirmButtonInstance.Active = false;
                    return;
                }
                if (this.slotData.race === `Race`) return;
                if (this.slotData.name === undefined || this.slotData.name === ``) {
                    confirmButton.miscData.set(`AllowToConfirm`, false);
                    confirmButtonInstance.Active = false;
                    return;
                }
                if (this.slotData.name.size() > 15 || this.slotData.name.size() < 3) {
                    this.IncorrectName(`Name must be more than 3 symbols and lover than 15`);
                    confirmButton.miscData.set(`AllowToConfirm`, false);
                    confirmButtonInstance.Active = false;
                    return;
                }

                let [cleanName] = this.slotData.name.gsub("[^A-Za-z]", "");

                if (this.slotData.name !== cleanName) {
                    this.IncorrectName(`Name must contain only English letters`);
                    confirmButton.miscData.set(`AllowToConfirm`, false);
                    confirmButtonInstance.Active = false;
                    return;
                }

                const result = await this.getFilteredSlotName();
                const taggedName = result.filtered
                    ? this.slotData.name
                    : `#`.rep(result.name.size());
                this.slotData.name = taggedName;
                characterCreation.EnterName.TextBox.Text = taggedName;

                if (!result.filtered) {
                    this.IncorrectName(taggedName);
                    task.wait(1);
                    this.IncorrectName(`Name broke Roblox rules!`);
                    confirmButton.miscData.set(`AllowToConfirm`, false);
                    confirmButtonInstance.Active = false;
                    return;
                }

                confirmButton.miscData.set(`AllowToConfirm`, true);
                confirmButtonInstance.Active = true;

                confirmButtonInstance.FailedGradient.Enabled = false;
                confirmButtonInstance.SuccsessGradient.Enabled = true;
                confirmButtonInstance.Title.TextTransparency = 0;
            },
            undefined,
            `ConfirmButton`,
        );
    }

    public Hide() {
        let characterCreation = this.mainMenu.CharacterCreation;
        characterCreation.Visible = false;
        this.buses.uiBus.Fire(`SelectCharacterUIController/Show`);
    }

    public Show(slotId: string, animation?: boolean, hideMenu?: boolean) {
        let characterCreation = this.mainMenu.CharacterCreation;

        this.WaitForPlayerData();

        this.slotData = {
            gender: `Gender`,
            race: `Race`,
            name: undefined,
        };

        this.SetupGenders(animation);
        this.SetupRaces(animation);
        this.SetupEnterName();
        this.SetupConfirmButton(slotId);

        characterCreation.Visible = true;
    }

    public CreateSlot(slotId: string) {
        this.Show(slotId, true, true);
    }
}
