export type IButtonsContainer = {
	["Credits"]: {
		["UIScale"]: UIScale;
		["UIStroke"]: UIStroke;
		["UIStroke1"]: UIStroke;
		["UIStroke2"]: UIStroke;
	} & TextButton;
	["Play"]: {
		["UIScale"]: UIScale;
		["UIStroke"]: UIStroke;
		["UIStroke1"]: UIStroke;
		["UIStroke2"]: UIStroke;
	} & TextButton;
	["SelectCharacter"]: {
		["UIScale"]: UIScale;
		["UIStroke"]: UIStroke;
		["UIStroke1"]: UIStroke;
		["UIStroke2"]: UIStroke;
	} & TextButton;
	["UICorner"]: UICorner;
	["UIListLayout"]: UIListLayout;
	["UIPadding"]: UIPadding;
} & ScrollingFrame;