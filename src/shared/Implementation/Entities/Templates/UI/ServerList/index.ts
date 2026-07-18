import { CreateRegionTemplate, IRegionTemplate } from "./RegionTemplate";
import { CreateServerTemplate, IServerTemplate } from "./ServerTemplate";

class ServerListUITemplatesClass {
    public ServerTemplate(): IServerTemplate {
        return CreateServerTemplate();
    }

    public RegionTemplate(): IRegionTemplate {
        return CreateRegionTemplate();
    }
}

export const ServerListUITemplates = new ServerListUITemplatesClass();
