import { IButtonsContainer } from "./IButtonsContainer";
import { ICharacterCreation } from "./ICharacterCreation";
import { ICharacterSlots } from "./ICharacterSlots";

export type IMainMenu = {
    [`CharacterSlots`]: ICharacterSlots;
    [`CharacterCreation`]: ICharacterCreation;
    [`ButtonsContainer`]: IButtonsContainer;
} & Frame;
