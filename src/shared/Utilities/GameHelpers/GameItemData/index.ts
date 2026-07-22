import { ParseRobloxAliasPath } from "shared/Utilities/GetObjectFromPath";

class GetItemData {
    public GetGameplayItemData<T>(itemType: string, itemId: number): T {
        const module = ParseRobloxAliasPath(`shared/Info/GamePlay/${itemType}`) as ModuleScript;
        const data = require(module) as Record<number, T>;

        return data[itemId];
    }
}

export = new GetItemData();
