import { IServerList } from "./IServerList";
import { IMainMenu } from "./MainMenu";

export type IPlayerInterface = {
    ["ServerList"]: IServerList;
    [`MainMenu`]?: IMainMenu;
    ["ServerListVignette"]: ImageLabel;
} & ScreenGui;
