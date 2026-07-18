import { Controller, OnStart } from "@flamework/core";
import { ClientSignals } from "shared/Implementation/Entities/ClientSignals";
import { VFXModules } from "shared/Implementation/Entities/VFXs";

type VFXMethod = (...args: unknown[]) => void;
type VFXInstance = Record<string, VFXMethod>;

@Controller()
export class VFXSignal implements OnStart {
    onStart(): void {
        ClientSignals.LaunchVFX.connect((vfx: string, method: string, ...args: unknown[]) => {
            const moduleFactory = VFXModules[vfx as keyof typeof VFXModules];

            if (!moduleFactory) {
                warn(`VFX ${vfx} does not exist`);
                return;
            }

            const vfxModule = moduleFactory() as unknown as VFXInstance;

            const callback = vfxModule[method];

            if (!callback) {
                warn(`Method ${method} does not exist in ${vfx}`);
                return;
            }

            callback(vfxModule, ...args);
        });
    }
}
