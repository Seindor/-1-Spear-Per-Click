import {
    CreateCharacterCreationButtonTemplate,
    ICharacterCreationButtonTemplate,
} from "./CharacterCreationButtonTemplate";
import { CreateCharacterSlotTemplate, ICharacterSlotTemplate } from "./CharacterSlotTemplate";

class CharacterCreationClass {
    public CharacterSlot(): ICharacterSlotTemplate {
        return CreateCharacterSlotTemplate();
    }

    public CreateCharacterCreationButton(): ICharacterCreationButtonTemplate {
        return CreateCharacterCreationButtonTemplate();
    }
}

export const CharacterCreationUITemplates = new CharacterCreationClass();
