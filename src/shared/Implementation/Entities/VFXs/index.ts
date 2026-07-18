import { Default } from "./Default";
import { Dependency } from "@flamework/core";

export const VFXModules = {
    ["Default"]: (): Default => {
        return Dependency<Default>();
    },
};
