import { CharacterCreationUITemplates } from "./Data/CharacterCreation";
import { ServerListUITemplates } from "./ServerList";

class ClassUITemplates {
    public serverListTemplates = ServerListUITemplates;
    public characterCreationTemplates = CharacterCreationUITemplates;
}

export const UITemplates = new ClassUITemplates();
