import {
    ClientPlayerContext,
    ClientPlayerPipelineToken,
} from "shared/Types/Pipelines/ClientsPlayer/ClientPlayerPipeline";
import { PipelineContext } from "shared/Domain/Pipeline/Aggregates/PipelineContext";

import { UIFrameAggregate } from "shared/Domain/UIWrapper/Aggregates/UIFrameAggregate";

import { IPlayerInterface } from "shared/Types/Gameplay/UI/IPlayerInterface";
import { IMainMenu } from "shared/Types/Gameplay/UI/MainMenu";

import { Pipeline } from "shared/Domain/Pipeline/Decorators/Pipeline";
import { PipelineStep } from "shared/Domain/Pipeline/Aggregates/PipelineStep";

import { PlaceIds } from "shared/Types/Game/ServerInfo";

import { SelectCharacterUIController } from "./SelectCharacterUIController";

import { SharedRegistry } from "shared/DI/Generated/SharedRegistry";
import { CompositionRootShared } from "shared/DI/CompositionRootShared";
import { CreateCharacterUIController } from "./CreateCharacterUIController";
import { ISlotData } from "shared/Types/Database/PlayerData";
import { PlayButtonUIController } from "./PlayButton";

const sharedScope = CompositionRootShared.createScope();

const eventBusAPI = sharedScope.resolve(SharedRegistry.Singletons.API.EventBusAPI);
const uiWrapperAPI = sharedScope.resolve(SharedRegistry.Singletons.API.UIWrapperAPI);

@Pipeline({ Pipeline: ClientPlayerPipelineToken })
export class MainMenuUIStep extends PipelineStep<ClientPlayerContext> {
    public readonly Id = `MainMenuUIStep`;
    public readonly After = [`UIInitStep`, `LoadReplicatorsStep`];

    public controllers!: {
        selectCharacterUIController: SelectCharacterUIController;
        createCharacterUIController: CreateCharacterUIController;
        playButtonUIController: PlayButtonUIController;
    };

    public Execute(ctx: PipelineContext<ClientPlayerContext>): void {
        if (game.PlaceId !== PlaceIds[`Main Menu`]) {
            ctx.MarkFailed(this.Id);
            return;
        }

        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        this.controllers = {
            selectCharacterUIController: new SelectCharacterUIController(ctx, playerInterface),
            createCharacterUIController: new CreateCharacterUIController(ctx, playerInterface),
            playButtonUIController: new PlayButtonUIController(ctx, playerInterface),
        };

        this.SetupEvents(ctx);

        ctx.Set(`${this.Id}/Controllers`, this.controllers);

        ctx.MarkCompleted(this.Id);
    }

    public SetupEvents(ctx: PipelineContext<ClientPlayerContext>) {
        const uiBus = eventBusAPI.New(ctx.Data.id, `UI`);

        uiBus.Subscribe(
            `MainMenu/Show`,
            (show?: boolean) => {
                this.Show(ctx, show);
            },
            undefined,
            `MainMenuUIStep/MainMenu/Show`,
        );

        uiBus.Subscribe(
            `MainMenu/ShowButtons`,
            (show?: boolean) => {
                this.ShowButtons(ctx, show);
            },
            undefined,
            `MainMenuUIStep/MainMenu/ShowButtons`,
        );

        uiBus.Subscribe(
            `CreateCharacterUIController/CreateSlot`,
            (slotId: string) => {
                this.controllers.createCharacterUIController.CreateSlot(slotId);
            },
            undefined,
            `MainMenuUIStep/CreateCharacterUIController/CreateSlot`,
        );

        uiBus.Subscribe(`SelectCharacterUIController/Show`, () => {
            this.controllers.selectCharacterUIController.Show(true);
        });
    }

    public Show(ctx: PipelineContext<ClientPlayerContext>, show?: boolean) {
        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        if (!playerInterface.FindFirstChild(`MainMenu`)) return;

        let mainMenu = playerInterface.FindFirstChild(`MainMenu`) as IMainMenu;

        if (show !== undefined) {
            mainMenu.Visible = show;
        } else if (show === undefined) {
            mainMenu.Visible = !mainMenu.Visible;
        }
    }

    public ShowButtons(ctx: PipelineContext<ClientPlayerContext>, show?: boolean) {
        const id = this.Id;
        let player = ctx.Data.player;
        let playerGui = player.WaitForChild(`PlayerGui`) as PlayerGui;
        let playerInterface = playerGui.WaitForChild(`PlayerInterface`) as IPlayerInterface;

        if (!playerInterface.FindFirstChild(`MainMenu`)) return;

        let mainMenu = playerInterface.FindFirstChild(`MainMenu`) as IMainMenu;

        let buttonsContainerFrame = uiWrapperAPI.Create(mainMenu.ButtonsContainer);

        const showFrame = () => {
            buttonsContainerFrame.miscData.set(`Shown`, true);
            buttonsContainerFrame.EmitEffect([
                {
                    Name: "MoveFrame",
                    Params: { duration: 0.2, target: new UDim2(0.5, 0, 0.65, 0) },
                },
            ]);
        };

        const hideFrame = () => {
            buttonsContainerFrame.miscData.set(`Shown`, false);
            buttonsContainerFrame.EmitEffect([
                {
                    Name: "MoveFrame",
                    Params: { duration: 0.2, target: new UDim2(0.5, 0, 1.15, 0) },
                },
            ]);
        };

        if (show === true) {
            showFrame();
            return;
        } else if (show === false) {
            hideFrame();
            return;
        }

        if ((buttonsContainerFrame.miscData.get(`Shown`) as boolean) === true) {
            hideFrame();
        } else {
            showFrame();
        }
    }
}
