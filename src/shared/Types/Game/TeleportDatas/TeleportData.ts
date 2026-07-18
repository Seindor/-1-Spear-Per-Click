export interface GameTeleportData {
    fromQuickJoin?: boolean;
    owner?: string;
    accessCode?: string;
    createdVia?: "QuickJoin" | "Manual" | "Rejoin";
    visibility?: `Public` | `Private`;
}
