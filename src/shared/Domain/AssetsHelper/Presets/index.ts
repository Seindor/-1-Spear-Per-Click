import PurpleHighlight from "./Highlights/PurpleHighlight";
import WhiteHighlight from "./Highlights/WhiteHighlight";
import YellowHighlight from "./Highlights/YellowHighlight";

export const AssetHelperPresets = {
    ["Highlights/YellowHighlight"]: YellowHighlight,
    ["Highlights/WhiteHighlight"]: WhiteHighlight,
    ["Highlights/PurpleHighlight"]: PurpleHighlight,
} as const;
