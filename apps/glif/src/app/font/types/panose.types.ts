export interface PanoseClass {
	bFamilyType: FamilyKind;
	bSerifStyle: number;
	bWeight: number;
	bProportion: number;
	bContrast: number;
	bStrokeVariation: number;
	bArmStyle: number;
	bLetterform: number;
	bMidline: number;
	bXHeight: number;
}

export interface PanoseLatinText extends PanoseClass {
	bFamilyType: FamilyKind.Text;
	bSerifStyle: SerifStyle;
	bWeight: Weight;
	bProportion: Proportion;
	bContrast: Contrast;
	bStrokeVariation: StrokeVariation;
	bArmStyle: ArmStyle;
	bLetterform: Letterform;
	bMidline: Midline;
	bXHeight: XHeight;
}

export enum FamilyKind {
	Any = 0,
	NoFit = 1,
	Text,
	HandWritten,
	Decorative,
	Symbol,
}

export enum SerifStyle {
	Any = 0,
	NoFit = 1,
	Cove,
	ObtuseCove,
	SquareCove,
	ObtuseSquareCove,
	Square,
	Thin,
	Oval,
	Exaggerated,
	Triangle,
	NormalSans,
	ObtuseSans,
	PerpendicularSans,
	Flared,
	Rounded,
}

export enum Weight {
	Any = 0,
	NoFit = 1,
	VeryLight,
	Light,
	Thin,
	Book,
	Medium,
	Demi,
	Bold,
	Heavy,
	Black,
	ExtraBlack,
}

export enum Proportion {
	Any = 0,
	NoFit = 1,
	OldStyle,
	Modern,
	EvenWidth,
	Extended,
	Condensed,
	VeryExtended,
	VeryCondensed,
	Monospaced,
}

export enum Contrast {
	Any = 0,
	NoFit = 1,
	None,
	VeryLow,
	Low,
	MediumLow,
	Medium,
	MediumHigh,
	High,
	VeryHigh,
}

export enum StrokeVariation {
	Any = 0,
	NoFit = 1,
	NoVariation,
	Gradual_Diagonal,
	Gradual_Transitional,
	Gradual_Vertical,
	Gradual_Horizontal,
	Rapid_Vertical,
	Rapid_Horizontal,
	Instant_Vertical,
	Instant_Horizontal,
}

export enum ArmStyle {
	Any = 0,
	NoFit = 1,
	StraightArms_Horizontal,
	StraightArms_Wedge,
	StraightArms_Vertical,
	StraightArms_SingleSerif,
	StraightArms_DoubleSerif,
	NonStraight_Horizontal,
	NonStraight_Wedge,
	NonStraight_Vertical,
	NonStraight_SingleSerif,
	NonStraight_DoubleSerif,
}

export enum Letterform {
	Any = 0,
	NoFit = 1,
	Normal_Contact,
	Normal_Weighted,
	Normal_Boxed,
	Normal_Flattened,
	Normal_Rounded,
	Normal_OffCenter,
	Normal_Square,
	Oblique_Contact,
	Oblique_Weighted,
	Oblique_Boxed,
	Oblique_Flattened,
	Oblique_Rounded,
	Oblique_OffCenter,
	Oblique_Square,
}

export enum Midline {
	Any = 0,
	NoFit = 1,
	Standard_Trimmed,
	Standard_Pointed,
	Standard_Serifed,
	High_Trimmed,
	High_Pointed,
	High_Serifed,
	Constant_Trimmed,
	Constant_Pointed,
	Constant_Serifed,
	Low_Trimmed,
	Low_Pointed,
	Low_Serifed,
}

export enum XHeight {
	Any = 0,
	NoFit = 1,
	Constant_Small,
	Constant_Standard,
	Constant_Large,
	Ducking_Small,
	Ducking_Standard,
	Ducking_Large,
}
