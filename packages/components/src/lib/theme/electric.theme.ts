import { ThemeColorPalettes, ThemeDefinition, ThemeVars } from "./theme.types";

const DARK_COLORS: ThemeColorPalettes = {
	background: {
		100: "#0E0E0E",
		200: "#131313",
		300: "#181818",
		400: "#1D1D1D",
		500: "#222222",
		600: "#2A2A2A",
		700: "#343434",
		800: "#3E3E3E",
		900: "#4A4A4A",
	},
	foreground: {
		 50: "#F0F0F0",
		100: "#CDCDCD",
		200: "#AAAAAA",
		300: "#898989",
		400: "#6D6D6D",
		500: "#545454",
	},
	primary: {
		 50: "#331B59",
		100: "#3A1E66",
		200: "#45207D",
		300: "#5523A1",
		400: "#6829C2",
		500: "#7A2EE5",
		600: "#9456EB",
		700: "#AC7CF3",
		800: "#CAA9FF",
		900: "#E0CFFF",
	},
	accent: {
		 50: "#113336",
		100: "#143a3e",
		200: "#10484B",
		300: "#16656A",
		400: "#0F8E96",
		500: "#00B2BD",
		600: "#26C9D4",
		700: "#00E3F1",
		800: "#72F6FF",
		900: "#B2FAFF",
	},
	warning: {
		 50: "#710B05",
		100: "#940F00",
		200: "#AF1700",
		300: "#D42E0C",
		400: "#ED3713",
		500: "#FF4C00",
		600: "#FF841F",
		700: "#FFC744",
		800: "#FFDC73",
		900: "#FFEAA0",
	},
};

const DARK_VARS: ThemeVars = {
	elevation100: "0 0  2px 0 rgba(0,0,0,0.08), 0  2px  4px 0 rgba(0,0,0,0.3)",
	elevation200: "0 0  4px 0 rgba(0,0,0,0.10), 0  4px 10px 0 rgba(0,0,0,0.3)",
	elevation300: "0 0  8px 0 rgba(0,0,0,0.12), 0  8px 21px 0 rgba(0,0,0,0.3)",
	elevation400: "0 0 16px 0 rgba(0,0,0,0.17), 0 16px 48px 0 rgba(0,0,0,0.3)",
};

const LIGHT_COLORS: ThemeColorPalettes = {
	background: {
		100: "#D8D8D8",
		200: "#E0E0E0",
		300: "#E8E8E8",
		400: "#F1F1F1",
		500: "#FFFFFF",
		600: "#F9F9F9",
		700: "#F1F1F1",
		800: "#E8E8E8",
		900: "#E0E0E0",
	},
	foreground: {
		 50: "#000000",
		100: "#3C3C3C",
		200: "#5F5F5F",
		300: "#878787",
		400: "#A9A9A9",
		500: "#BBBBBB",
	},
	primary: {
		 50: "#F5EAFF",
		100: "#E7D0FF",
		200: "#D8B2FF",
		300: "#BD95FF",
		400: "#9C60FF",
		500: "#8000FF",
		600: "#6500CA",
		700: "#5500AA",
		800: "#42137E",
		900: "#37224B",
	},
	accent: {
		 50: "#DDFDFF",
		100: "#B6FBFF",
		200: "#72F7FF",
		300: "#00E3F1",
		400: "#00CBD8",
		500: "#00B2BD",
		600: "#0C99A1",
		700: "#16757B",
		800: "#0E5A5F",
		900: "#063A3E",
	},
	warning: {
		 50: "#FFF5C2",
		100: "#FFEBA0",
		200: "#FFDC73",
		300: "#FFC744",
		400: "#FF841F",
		500: "#FF4C00",
		600: "#ED3713",
		700: "#D42E0C",
		800: "#AD250A",
		900: "#862613",
	},
};

// dprint-ignore
const LIGHT_VARS: ThemeVars = {
	elevation100: "0 0  2px 0 rgba(0,0,0,0.05),  0  2px  4px 0 rgba(0,0,0,0.1)",
	elevation200: "0 0  4px 0 rgba(0,0,0,0.058), 0  4px 10ox 0 rgba(0,0,0,0.116)",
	elevation300: "0 0  8px 0 rgba(0,0,0,0.066), 0  8px 21px 0 rgba(0,0,0,0.133)",
	elevation400: "0 0 16px 0 rgba(0,0,0,0.075), 0 16px 48px 0 rgba(0,0,0,0.15)",
};

const THEME_VARS: ThemeVars = {
	globalFontFamily: "'Barlow', sans-serif",
};

export const DEFAULT_THEME: ThemeDefinition = {
	light: {
		colors: LIGHT_COLORS,
		vars: {
			...THEME_VARS,
			...LIGHT_VARS,
		},
	},
	dark: {
		colors: DARK_COLORS,
		vars: {
			...THEME_VARS,
			...DARK_VARS,
		},
	},
};
