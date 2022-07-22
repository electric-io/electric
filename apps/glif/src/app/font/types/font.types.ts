import { match, Transparent } from "@electric/utils";

import { PanoseClass } from "./panose.types";
import {
	parseDate,
	parseDecimal,
	parsef32,
	parseFlags,
	parseHex,
	parseu32version,
	readString,
} from "./parse";

export const MAGIC_NUMBER = 0x5F0F3CF5;

export type u8 = number;
export type i8 = number;
export type u16 = number;
export type i16 = number;
export type u32 = number;
export type i32 = number;
export type u64 = number;
export type i64 = number;
export type int = number;
export type uint = number;
export type f32 = number;
export type f64 = number;
export type FWORD = number;
export type UFWORD = number;

export enum Flags {
	/**
	 * Baseline for font at y=0.
	 */
	BaselineAtY0        = 0b0_00000000_00000001,
	/**
	 * Left sidebearing point at x=0 (relevant only for TrueType rasterizers)
	 * @see [Note regarding variable fonts](https://docs.microsoft.com/en-us/typography/opentype/spec/head)
	 */
	LsbAtX0             = 0b0_00000000_00000010,
	/**
	 * Instructions may depend on point size.
	 */
	InstrDependOnPtSize = 0b0_00000000_00000100,
	/**
	 * Force ppem to integer values for all internal scaler math; may use
	 * fractional ppem sizes if this bit is clear. It is strongly recommended
	 * that this be set in hinted fonts.
	 */
	ForcePpemToInt      = 0b0_00000000_00001000,
	/**
	 * Instructions may alter advance width (the advance widths might not scale
	 * linearly).
	 */
	NonlinearAdvWidths  = 0b0_00000000_00010000,
	/**
	 * This bit is not used in OpenType, and should not be set in order to ensure
	 * compatible behavior on all platforms. If set, it may result in different
	 * behavior for vertical layout in some platforms. (See [Apple’s specification](http://developer.apple.com/fonts//TrueType-Reference-Manual/RM06/Chap6head.html)
	 * for details regarding behavior in Apple platforms.)
	 */
	UNUSED_OPENTYPE     = 0b0_00000000_00100000,
	/**
	 * These bits are not used in Opentype and should always be cleared. (See
	 * [Apple’s specification](http://developer.apple.com/fonts//TrueType-Reference-Manual/RM06/Chap6head.html)
	 * for details regarding legacy used in Apple platforms.)
	 */
	UNUSED_OPENTYPE1    = 0b0_00001111_11000000,
	/**
	 * Font data is “lossless” as a result of having been subjected to optimizing
	 * transformation and/or compression (such as e.g. compression mechanisms
	 * defined by ISO/IEC 14496-18, MicroType Express, WOFF 2.0 or similar) where
	 * the original font functionality and features are retained but the binary
	 * compatibility between input and output font files is not guaranteed. As a
	 * result of the applied transform, the DSIG table may also be invalidated.
	 */
	Lossless            = 0b0_00010000_00000000,
	/**
	 * Font converted (produce compatible metrics).
	 */
	Converted           = 0b0_00100000_00000000,
	/**
	 * Font optimized for ClearType™. Note, fonts that rely on embedded bitmaps
	 * (EBDT) for rendering should not be considered optimized for ClearType, and
	 * therefore should keep this bit cleared.
	 */
	ClearTypeOptimized  = 0b0_01000000_00000000,
	/**
	 * If set, indicates that the glyphs encoded in the 'cmap' subtables are
	 * simply generic symbolic representations of code point ranges and don’t
	 * truly represent support for those code points. If unset, indicates that
	 * the glyphs encoded in the 'cmap' subtables represent proper support for
	 * those code points.
	 */
	LastResortFont      = 0b0_10000000_00000000,
	/**
	 * Reserved, set to 0.
	 */
	RESERVED            = 0b1_00000000_00000000,
}

export enum MacStyleFlags {
	Bold      = 0b00000000_00000001,
	Italic    = 0b00000000_00000010,
	Underline = 0b00000000_00000100,
	Outline   = 0b00000000_00001000,
	Shadow    = 0b00000000_00010000,
	Condensed = 0b00000000_00100000,
	Extended  = 0b00000000_01000000,
	RESERVED  = 0b11111111_10000000,
}

/**
 * @note
 * A neutral character has no inherent directionality; it is not a character
 * with zero (0) width. Spaces and punctuation are examples of neutral
 * characters. Non-neutral characters are those with inherent directionality.
 * For example, Roman letters (left-to-right) and Arabic letters (right-to-left)
 * have directionality. In a “normal” Roman font where spaces and punctuation
 * are present, the font direction hints should be set to {@linkcode Default}.
 *
 * @note Values other than `Default` are deprecated.
 */
export enum FontDirectionHint {
	/**
	 * Like {@linkcode StronglyRightToLeft} but also contains neutrals.
	 * @deprecated Set to `Default`
	 */
	StronglyRightToLeftPlusNeutrals = -2,
	/**
	 * Only strongly right to left.
	 * @deprecated Set to `Default`
	 */
	StronglyRightToLeft = -1,
	/**
	 * Fully mixed directional glyphs.
	 * @deprecated Set to `Default`
	 */
	FullyMixed = 0,
	/**
	 * Only strongly left to right.
	 * @deprecated Set to `Default`
	 */
	StronglyLeftToRight = 1,
	/**
	 * Like {@linkcode StronglyLeftToRight} but also contains neutrals.
	 * @deprecated Set to `Default`
	 */
	StronglyLeftToRightPlusNeutrals = 2,

	Default = StronglyLeftToRightPlusNeutrals,
}

export enum IndexToLocFormat {
	Offset16 = 0,
	Offset32 = 1,
}

/**
 * Indicates font embedding licensing rights for the font.
 *
 * @note
 * Valid fonts must set at most one of bits 1, 2 or 3; bit 0 is permanently
 * reserved and must be zero.
 *
 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#fstype
 */
export enum FsTypeFlags {
	/**
	 * Installable embedding: the font may be embedded, and may be permanently
	 * installed for use on a remote systems, or for use by other users. The user
	 * of the remote system acquires the identical rights, obligations and
	 * licenses for that font as the original purchaser of the font, and is
	 * subject to the same end-user license agreement, copyright, design patent,
	 * and/or trademark as was the original purchaser.
	 */
	Embedding_Installable       = 0b0000_0000_0000_0000,
	/**
	 * Restricted License embedding: the font must not be modified, embedded or
	 * exchanged in any manner without first obtaining explicit permission of the
	 * legal owner.
	 */
	Embedding_RestrictedLicense = 0b0000_0000_0000_0010,
	/**
	 * Preview & Print embedding: the font may be embedded, and may be
	 * temporarily loaded on other systems for purposes of viewing or printing
	 * the document. Documents containing Preview & Print fonts must be opened
	 * “read-only”; no edits can be applied to the document.
	 */
	Embedding_PreviewPrint      = 0b0000_0000_0000_0100,
	/**
	 * Editable embedding: the font may be embedded, and may be temporarily
	 * loaded on other systems. As with Preview & Print embedding, documents
	 * containing Editable fonts may be opened for reading. In addition, editing
	 * is permitted, including ability to format new text using the embedded
	 * font, and changes may be saved.
	 */
	Embedding_Editable          = 0b0000_0000_0000_1000,
	/**
	 * No subsetting: When this bit is set, the font may not be subsetted prior
	 * to embedding. Other embedding restrictions specified in bits 0 to 3 and
	 * bit 9 also apply.
	 */
	NoSubsetting                = 0b0000_0001_0000_0000,
	/**
	 * Bitmap embedding only: When this bit is set, only bitmaps contained in the
	 * font may be embedded. No outline data may be embedded. If there are no
	 * bitmaps available in the font, then the font is considered unembeddable
	 * and the embedding services will fail. Other embedding restrictions
	 * specified in bits 0-3 and 8 also apply.
	 */
	BitmapEmbeddingOnly         = 0b0000_0010_0000_0000,
	/**
	 * Reserved, must be zero.
	 */
	RESERVED                    = 0b1111_1100_1111_0001,
}

/**
 * This table gives global information about the font. The bounding box values
 * should be computed using only glyphs that have contours. Glyphs with no
 * contours should be ignored for the purposes of these calculations.
 */
export class FontHeaderTable {
	static fromXml(xml: Element): FontHeaderTable {
		const result = new FontHeaderTable();
		for (let i = 0; i < xml.childElementCount; ++i) {
			const child = xml.children[i];
			match(child.nodeName, {
				tableVersion: () => result.tableVersion = parsef32(child),
				fontRevision: () => result.fontRevision = readString(child),
				checkSumAdjustment: () => result.checkSumAdjustment = parseHex(child),
				magicNumber: () => result.magicNumber = MAGIC_NUMBER,
				flags: () => result.flags = parseFlags<Flags>(child),
				unitsPerEm: () => result.unitsPerEm = parseDecimal(child),
				created: () => result.created = parseDate(child),
				modified: () => result.modified = parseDate(child),
				xMin: () => {
					result.xRange ??= {} as Range<i16>;
					result.xRange.min = parseDecimal(child);
				},
				xMax: () => {
					result.xRange ??= {} as Range<i16>;
					result.xRange.max = parseDecimal(child);
				},
				yMin: () => {
					result.yRange ??= {} as Range<i16>;
					result.yRange.min = parseDecimal(child);
				},
				yMax: () => {
					result.yRange ??= {} as Range<i16>;
					result.yRange.max = parseDecimal(child);
				},
				macStyle: () => result.macStyle = parseFlags<MacStyleFlags>(child),
				lowestRecPPEM: () => result.lowestRecPPEM = parseInt(child.getAttribute("value")!, 10),
				fontDirectionHint: () => result.fontDirectionHint = parseDecimal(child),
				indexToLocFormat: () => result.indexToLocFormat = parseDecimal(child),
				glyphDataFormat: () => result.glyphDataFormat = parseDecimal(child),
			});
		}
		return result;
	}

	private constructor () {}

	tableVersion!: f32;
	fontRevision!: string;
	checkSumAdjustment!: u32;
	/**
	 * Set by font manufacturer.
	 */
	magicNumber!: typeof MAGIC_NUMBER;
	/**
	 * See {@linkcode Flags}
	 */
	flags!: Flags;
	/**
	 * Set to a value from 16 to 16384. Any value in this range is valid. In
	 * fonts that have TrueType outlines, a power of 2 is recommended as this
	 * allows performance optimizations in some rasterizers.
	 */
	unitsPerEm!: u16;
	created!: Date;
	modified!: Date;
	/**
	 * Minimum and maximum x coordinates across all glyph bounding boxes.
	 */
	xRange!: Range<i16>;
	/**
	 * Minimum and maximum y coordinates across all glyph bounding boxes.
	 */
	yRange!: Range<i16>;
	/**
	 * See {@linkcode MacStyleFlags}
	 */
	macStyle!: MacStyleFlags;
	/**
	 * Smallest readable size in pixels.
	 */
	lowestRecPPEM!: u16;
	/**
	 * See {@linkcode FontDirectionHint}
	 */
	fontDirectionHint!: FontDirectionHint;
	/**
	 * See {@linkcode IndexToLocFormat}
	 */
	indexToLocFormat!: IndexToLocFormat;
	/**
	 * 0 for current format.
	 */
	glyphDataFormat!: i16;
}

/**
 * This table contains information for horizontal layout. The values in the
 * {@linkcode minRightSidebearing}, {@linkcode minLeftSideBearing} and
 * {@linkcode xMaxExtent} should be computed using _only_ glyphs that have
 * contours. Glyphs with no contours should be ignored for the purposes of these
 * calculations.
 *
 * ### `hhea` Table and OpenType Font Variations
 * In a variable font, various font-metric values within the horizontal header
 * table may need to be adjusted for different variation instances. Variation
 * data for `hhea` entries can be provided in the {@link TODO metrics variations (MVAR)}
 * table. Different `hhea` entries are associated with particular variation data
 * in the MVAR table using value tags, as follows:
 *
 * | `hhea` entry                                | Tag                   |
 * | :------------------------------------------ | :-------------------- |
 * | {@linkcode caretOffset}                     | {@linkcode TODO hcof} |
 * | {@linkcode CaretSlope.rise caretSlope.rise} | {@linkcode TODO hcrs} |
 * | {@linkcode CaretSlope.run caretSlope.run}   | {@linkcode TODO hcrn} |
 */
export class HorizontalHeaderTable {
	static fromXml(xml: Element): HorizontalHeaderTable {
		const result = new HorizontalHeaderTable();
		for (let i = 0; i < xml.childElementCount; ++i) {
			const child = xml.children[i];
			match(child.nodeName, {
				tableVersion: () => result.tableVersion = parseu32version(child),
				ascent: () => result.ascender = parsef32(child),
				descent: () => result.descender = parsef32(child),
				lineGap: () => result.lineGap = parsef32(child),
				advanceWidthMax: () => result.advanceWidthMax = parsef32(child),
				minLeftSideBearing: () => result.minLeftSideBearing = parsef32(child),
				minRightSideBearing: () => result.minRightSideBearing = parsef32(child),
				xMaxExtent: () => result.xMaxExtent = parsef32(child),
				caretSlopeRise: () => {
					result.caretSlope ??= {} as CaretSlope;
					result.caretSlope.rise = parseDecimal(child);
				},
				caretSlopeRun: () => {
					result.caretSlope ??= {} as CaretSlope;
					result.caretSlope.run = parseDecimal(child);
				},
				caretOffset: () => result.caretOffset = parseDecimal(child),
				metricDataFormat: () => result.metricDataFormat = parseDecimal(child),
				numberOfHMetrics: () => result.numberOfHMetrics = parseDecimal(child),
				_: () => {
					console.warn(`Unhandled hhea field "${child.nodeName}"`);
				},
			});
		}
		return result;
	}

	private constructor () {}

	tableVersion!: u32;
	/**
	 * Apple specific; see [Apple's specification](http://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html)
	 * for details regarding Apple platforms. The {@linkcode TODO sTypoAscender},
	 * {@linkcode TODO sTypoDescender} and {@linkcode TODO sTypoLineGap} fields
	 * in the {@link TODO OS/2} table are used on the Windows platform, and are
	 * recommended for new text-layout implementations. Font developers should
	 * evaluate behavior in target applications that may use fields in this table
	 * or in the OS/2 table to ensure consistent layout. See the descriptions of
	 * the OS/2 fields for additional details.
	 */
	ascender!: FWORD;
	/**
	 * Apple specific; see [Apple's specification](http://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html)
	 * for details regarding Apple platforms. The {@linkcode TODO sTypoAscender},
	 * {@linkcode TODO sTypoDescender} and {@linkcode TODO sTypoLineGap} fields
	 * in the {@link TODO OS/2} table are used on the Windows platform, and are
	 * recommended for new text-layout implementations. Font developers should
	 * evaluate behavior in target applications that may use fields in this table
	 * or in the OS/2 table to ensure consistent layout. See the descriptions of
	 * the OS/2 fields for additional details.
	 */
	descender!: FWORD;
	/**
	 * Apple specific; see [Apple's specification](http://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6hhea.html)
	 * for details regarding Apple platforms. The {@linkcode TODO sTypoAscender},
	 * {@linkcode TODO sTypoDescender} and {@linkcode TODO sTypoLineGap} fields
	 * in the {@link TODO OS/2} table are used on the Windows platform, and are
	 * recommended for new text-layout implementations. Font developers should
	 * evaluate behavior in target applications that may use fields in this table
	 * or in the OS/2 table to ensure consistent layout. See the descriptions of
	 * the OS/2 fields for additional details.
	 */
	lineGap!: FWORD;
	/**
	 * Maximum advance width value in {@linkcode HorizontalMetricsTable hmtx}
	 * table.
	 */
	advanceWidthMax!: UFWORD;
	/**
	 * Minimum left sidebearing value in {@linkcode HorizontalMetricsTable hmtx}
	 * table for glyphs with contours (empty glyphs should be ignored).
	 */
	minLeftSideBearing!: FWORD;
	/**
	 * Minimum right sidebearing value; calculated as `min(aw - (lsb + xMax - xMin))`
	 * for glyphs with contours (empty glyphs should be ignored).
	 */
	minRightSideBearing!: FWORD;
	/**
	 * `Max(lsb + (xMax - xMin))`
	 */
	xMaxExtent!: FWORD;
	caretSlope!: CaretSlope;
	/**
	 * The amount by which a slanted highlight on a glyph needs to be shifted to
	 * produce the best appearance. Set to 0 for non-slanted fonts.
	 */
	caretOffset!: i16;
	/**
	 * 0 for current format.
	 */
	metricDataFormat!: i16;
	/**
	 * Number of {@linkcode HMetric} entries in {@linkcode HorizontalMetricsTable hmtx}
	 * table.
	 */
	numberOfHMetrics!: u16;
}

/**
 * Glyph metrics used for horizontal text layout include glyph advance widths,
 * side bearings and X-direction min and max values (xMin, xMax). These are
 * derived using a combination of the glyph outline data (`glyf`, `CFF` or
 * CFF2) and the horizontal metrics table. The horizontal metrics (`hmtx`) table
 * provides glyph advance widths and left side bearings.
 *
 * In a font with TrueType outline data, the {@linkcode TODO glyf} table
 * provides xMin and xMax values, but not advance widths or side bearings. The
 * advance width is always obtained from the `hmtx` table. In some fonts,
 * depending on the state of flags in the `head` table, the left side bearings
 * may be the same as the xMin values in the `glyf` table, though this is not
 * true for all fonts. (See the description of bit 1 of the flags field in the
 * {@linkcode FontHeaderTable head} table.) For this reason, left side bearings
 * are provided in the `hmtx` table. The right side bearing is always derived
 * using advance width and left side bearing values from the `hmtx` table, plus
 * bounding-box information in the glyph description — see below for more
 * details.
 *
 * In a variable font with TrueType outline data, the left side bearing value in
 * the `hmtx` table must always be equal to xMin (bit 1 of the `head` flags
 * field must be set). Hence, these values can also be derived directly from the
 * `glyf` table. Note that these values apply only to the default instance of
 * the variable font: non-default instances may have different side bearing
 * values. These can be derived from interpolated “phantom point” coordinates
 * using the {@linkcode TODO gvar} table (see below for additional details), or
 * by applying variation data in the {@linkcode TODO HVAR} table to
 * default-instance values from the `glyf` or `hmtx` table.
 *
 * In a font with CFF version 1 outline data, the `CFF` table does include
 * advance widths. These values are used by PostScript processors, but are not
 * used in OpenType layout. In an OpenType context, the `hmtx` table is required
 * and must be used for advance widths. Note that fonts in a Font Collection
 * file that share a `CFF` table may specify different advance widths in
 * font-specific `hmtx` tables for a particular glyph index. Also note that the
 * CFF2 table does not include advance widths. In addition, for either CFF or
 * CFF2 data, there are no explicit xMin and xMax values; side bearings are
 * implicitly contained within the CharString data, and can be obtained from the
 * CFF / CFF2 rasterizer. Some layout engines may use left side bearing values
 * in the `hmtx` table, however; hence, font production tools should ensure that
 * the left side bearing values in the `hmtx` table match the implicit xMin
 * values reflected in the CharString data. In a variable font with CFF2 outline
 * data, left side bearing and advance width values for non-default instances
 * should be obtained by combining information from the `hmtx` and HVAR tables.
 *
 * The table uses a longHorMetric record to give the advance width and left side
 * bearing of a glyph. Records are indexed by glyph ID. As an optimization, the
 * number of records can be less than the number of glyphs, in which case the
 * advance width value of the last record applies to all remaining glyph IDs.
 * This can be useful in monospaced fonts, or in fonts that have a large number
 * of glyphs with the same advance width (provided the glyphs are ordered
 * appropriately). The number of longHorMetric records is determined by the
 * numberOfHMetrics field in the `hhea` table.
 *
 * If numberOfHMetrics is less than the total number of glyphs, then the
 * hMetrics array is followed by an array for the left side bearing values of
 * the remaining glyphs. The number of elements in the leftSideBearings array
 * will be derived from the numGlyphs field in the {@linkcode TODO maxp} table
 * minus numberOfHMetrics.
 *
 * In a font with TrueType outlines, xMin and xMax values for each glyph are
 * given in the `glyf` table. The advance width (“aw”) and left side bearing
 * (“lsb”) can be derived from the glyph “phantom points”, which are computed by
 * the TrueType rasterizer; or they can be obtained from the `hmtx` table. In a
 * font with CFF or CFF2 outlines, xMin (= left side bearing) and xMax values
 * can be obtained from the CFF / CFF2 rasterizer. From those values, the right
 * side bearing (“rsb”) is calculated as follows:
 * ```txt
 * rsb = aw - (lsb + xMax - xMin)
 * ```
 * If pp1 and pp2 are TrueType phantom points used to control lsb and rsb, their
 * initial position in the X-direction is calculated as follows:
 * ```txt
 * pp1 = xMin - lsb
 * pp2 = pp1 + aw
 * ```
 * If a glyph has no contours, xMax/xMin are not defined. The left side bearing
 * indicated in the `hmtx` table for such glyphs should be zero.
 */
export class HorizontalMetricsTable {
	static fromXml(xml: Element): HorizontalMetricsTable {
		const map = new Map<string, HMetric>();
		const result = new HorizontalMetricsTable(map);

		for (let i = 0; i < xml.childElementCount; ++i) {
			const mtx = xml.children[i];
			const name = mtx.getAttribute("name")!;

			map.set(name, new HMetric({
				width: parseFloat(mtx.getAttribute("width")!),
				lsb: parseFloat(mtx.getAttribute("lsb")!),
			}));
		}
		return result;
	}

	private constructor (metrics: Map<string, HMetric>) {
		this.hMetrics = metrics;
	}

	hMetrics: Map<string, HMetric>;
}

/**
 * This table contains a Compact Font Format font representation (also known as
 * a PostScript Type 1, or CIDFont) and is structured according to [Adobe
 * Technical Note #5176: “The Compact Font Format
 * Specification,”](http://partners.adobe.com/public/developer/en/font/5176.CFF.pdf)
 * and [Adobe Technical Note #5177: “Type 2 Charstring
 * Format.”](http://partners.adobe.com/public/developer/en/font/5177.Type2.pdf)
 *
 * OpenType fonts with TrueType outlines use a glyph index to specify and access
 * glyphs within a font; e.g., to index within the {@linkcode TODO loca} table
 * and thereby access glyph data in the `glyf` table. This concept is retained
 * in OpenType CFF fonts, except that glyph data is accessed through the
 * CharStrings INDEX of the `CFF` table.
 *
 * The Name INDEX in the CFF data must contain only one entry; that is, there
 * must be only one font in the CFF FontSet. It is not a requirement that this
 * name be the same as name ID 6 entries in the {@linkcode FontHeaderTable name}
 * table. Note that, in an OpenType font collection file, a single `CFF` table
 * can be shared across multiple fonts; names used by applications must be those
 * provided in the `name` table, not the Name INDEX entry. The CFF Top DICT must
 * specify a CharstringType value of 2. The numGlyphs field in the
 * {@linkcode TODO maxp} table must be the same as the number of entries in the
 * CFF’s CharStrings INDEX. The OpenType font glyph index is the same as the CFF
 * glyph index for all glyphs in the font.
 */
export class CFFTable {
	static fromXml(xml: Element): CFFTable {
		const result = new CFFTable();
		let majorVersion: number;
		let minorVersion: number;

		for (let i = 0; i < xml.childElementCount; ++i) {
			const child = xml.children[i];
			match(child.nodeName, {
				major: () => majorVersion = parseDecimal(child),
				minor: () => minorVersion = parseDecimal(child),
				CFFFont: () => result.font = CFFFont.fromXml(child),
				GlobalSubrs: () => {
					const subrs: string[] = new Array(child.childElementCount);
					for (let j = 0; j < child.childElementCount; ++j)
						subrs[j] = child.children[j].textContent ?? "";

					result.globalSubrs = subrs;
				},
			});
		}
		return result;
	}

	private constructor () {}

	version!: f32;
	font!: CFFFont;
	globalSubrs!: string[];
}

export class CFFFont {
	static fromXml(xml: Element): CFFFont {
		return new CFFFont();
	}

	private constructor () {}

	name!: string;
	version!: string;
	notice!: string;
	copyright!: string;
	fullName!: string;
	familyName!: string;
	weight!: string;
	isFixedPitch!: boolean;
	italicAngle!: number;
	underlinePosition!: number;
	underlineThickness!: number;
	paintType!: number;
	charstringType!: number;
	fontMatrix!: string;
	fontBBox!: string;
	strokeWidth!: number;
	encoding!: string;
}

type OS2Version = 0 | 1 | 2 | 3 | 4 | 5;

export class OS2Table<V extends OS2Version = OS2Version> {
	static fromXml(xml: Element): OS2Table {
		const result = new OS2Table();
		for (let i = 0; i < xml.childElementCount; ++i) {
			const child = xml.children[i];
			match(child.nodeName, {
				version: () => result.version = parseDecimal(child) as 0 | 1 | 2 | 3 | 4 | 5,
				xAvgCharWidth: () => result.xAvgCharWidth = parseDecimal(child),
				usWeightClass: () => result.usWeightClass = parseDecimal(child),
				usWidthClass: () => result.usWidthClass = parseDecimal(child),
				fsType: () => result.fsType = parseFlags<FsTypeFlags>(child),
				ySubscriptXSize: () => result.ySubscriptXSize = parseDecimal(child),
				ySubscriptYSize: () => result.ySubscriptYSize = parseDecimal(child),
				ySubscriptXOffset: () => result.ySubscriptXOffset = parseDecimal(child),
				ySubscriptYOffset: () => result.ySubscriptYOffset = parseDecimal(child),
				ySuperscriptXSize: () => result.ySuperscriptXSize = parseDecimal(child),
				ySuperscriptYSize: () => result.ySuperscriptYSize = parseDecimal(child),
				ySuperscriptXOffset: () => result.ySuperscriptXOffset = parseDecimal(child),
				ySuperscriptYOffset: () => result.ySuperscriptYOffset = parseDecimal(child),
				yStrikeoutSize: () => result.yStrikeoutSize = parseDecimal(child),
				yStrikeoutPosition: () => result.yStrikeoutPosition = parseDecimal(child),
				sFamilyClass: () => result.sFamilyClass = parseDecimal(child),
				panose: () => {
					const panose = {} as PanoseClass;
					for (let j = 0; j < child.childElementCount; ++j) {
						const entry = child.children[j];
						match(j, {
							0: () => panose.bFamilyType = parseDecimal(entry),
							1: () => panose.bSerifStyle = parseDecimal(entry),
							2: () => panose.bWeight = parseDecimal(entry),
							3: () => panose.bProportion = parseDecimal(entry),
							4: () => panose.bContrast = parseDecimal(entry),
							5: () => panose.bStrokeVariation = parseDecimal(entry),
							6: () => panose.bArmStyle = parseDecimal(entry),
							7: () => panose.bLetterform = parseDecimal(entry),
							8: () => panose.bMidline = parseDecimal(entry),
							9: () => panose.bXHeight = parseDecimal(entry),
						});
					}
					result.panose = panose;
				},
				ulUnicodeRange1: () => result.ulUnicodeRange1 = parseFlags(child),
				ulUnicodeRange2: () => result.ulUnicodeRange2 = parseFlags(child),
				ulUnicodeRange3: () => result.ulUnicodeRange3 = parseFlags(child),
				ulUnicodeRange4: () => result.ulUnicodeRange4 = parseFlags(child),
				achVendID: () => result.achVendID = readString(child),
				fsSelection: () => result.fsSelection = parseFlags(child),
				usFirstCharIndex: () => result.usFirstCharIndex = parseDecimal(child),
				usLastCharIndex: () => result.usLastCharIndex = parseDecimal(child),
				sTypoAscender: () => result.sTypoAscender = parseDecimal(child),
				sTypoDescender: () => result.sTypoDescender = parseDecimal(child),
				sTypoLineGap: () => result.sTypoLineGap = parseDecimal(child),
				usWinAscent: () => result.usWinAscent = parseDecimal(child),
				usWinDescent: () => result.usWinDescent = parseDecimal(child),
				ulCodePageRange1: () => result.ulCodePageRange1 = parseFlags(child),
				ulCodePageRange2: () => result.ulCodePageRange2 = parseFlags(child),
				sxHeight: () => result.sxHeight = parseDecimal(child),
				sCapHeight: () => result.sCapHeight = parseDecimal(child),
				usDefaultChar: () => result.usDefaultChar = parseDecimal(child),
				usBreakChar: () => result.usBreakChar = parseDecimal(child),
				usMaxContext: () => result.usMaxContext = parseDecimal(child),
				_: () => {
					console.warn(`Unhandled OS_2 table field: "${child.nodeName}"`);
				}
			});
		}
		return result;
	}

	private constructor () {}

	isVersion<VCheck extends OS2Version>(v: VCheck): this is OS2<V> {
		return (this.version as V | VCheck) === v;
	}

	/** OS/2 table version number. */
	version!: V;
	/**
	 * The Average Character Width parameter specifies the arithmetic average of
	 * the escapement (width) of all non-zero width glyphs in the font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#xavgcharwidth
	 */
	xAvgCharWidth!: i16;
	/**
	 * Indicates the visual weight (degree of blackness or thickness of strokes)
	 * of the characters in the font. Values from 1 to 1000 are valid.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#usweightclass
	 */
	usWeightClass!: u16;
	/**
	 * Indicates a relative change from the normal aspect ratio (width to height
	 * ratio) as specified by a font designer for the glyphs in a font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#uswidthclass
	 */
	usWidthClass!: u16;
	/**
	 * Indicates font embedding licensing rights for the font.
	 * @see {@linkcode FsTypeFlags}
	 */
	fsType!: FsTypeFlags;
	/**
	 * The recommended horizontal size in font design units for subscripts for
	 * this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysubscriptxsize
	 */
	ySubscriptXSize!: i16;
	/**
	 * The recommended vertical size in font design units for subscripts for
	 * this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysubscriptysize
	 */
	ySubscriptYSize!: i16;
	/**
	 * The recommended horizontal offset in font design units for subscripts for
	 * this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysubscriptxoffset
	 */
	ySubscriptXOffset!: i16;
	/**
	 * The recommended vertical offset in font design units from the baseline for
	 * subscripts for this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysubscriptyoffset
	 */
	ySubscriptYOffset!: i16;
	/**
	 * The recommended horizontal size in font design units for superscripts for
	 * this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysuperscriptxsize
	 */
	ySuperscriptXSize!: i16;
	/**
	 * The recommended vertical size in font design units for superscripts for
	 * this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysuperscriptysize
	 */
	ySuperscriptYSize!: i16;
	/**
	 * The recommended horizontal offset in font design units for superscripts
	 * for this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysuperscriptxoffset
	 */
	ySuperscriptXOffset!: i16;
	/**
	 * The recommended vertical offset in font design units from the baseline for
	 * superscripts for this font.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ysuperscriptyoffset
	 */
	ySuperscriptYOffset!: i16;
	/**
	 * Thickness of the strikeout stroke in font design units.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ystrikeoutsize
	 */
	yStrikeoutSize!: i16;
	/**
	 * The position of the top of the strikeout stroke relative to the baseline
	 * in font design units.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ystrikeoutposition
	 */
	yStrikeoutPosition!: i16;
	/**
	 * This parameter is a classification of font-family design.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#sfamilyclass
	 */
	sFamilyClass!: i16;
	/**
	 * used to describe the visual characteristics of a given typeface. These
	 * characteristics are then used to associate the font with other fonts of
	 * similar appearance having different names. The variables for each digit
	 * are listed below. The Panose values are fully described in the PANOSE
	 * Classification Metrics Guide, currently owned by Monotype Imaging and
	 * maintained at https://monotype.github.io/panose/.
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#panose
	 */
	panose!: PanoseClass;
	/**
	 * This field is used to specify the Unicode blocks or ranges encompassed by
	 * the font file in 'cmap' subtables for platform 3, encoding ID 1 (Microsoft
	 * platform, Unicode BMP) and platform 3, encoding ID 10 (Microsoft platform,
	 * Unicode full repertoire). If a bit is set (1), then the Unicode ranges
	 * assigned to that bit are considered functional. If the bit is clear (0),
	 * then the range is not considered functional. Each of the bits is treated
	 * as an independent flag and the bits can be set in any combination. The
	 * determination of “functional” is left up to the font designer, although
	 * character set selection should attempt to be functional by ranges if at
	 * all possible.
	 *
	 * TODO: Define enums for these fields
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#ulunicoderange1-bits-031ulunicoderange2-bits-3263ulunicoderange3-bits-6495ulunicoderange4-bits-96127
	 */
	ulUnicodeRange1!: u32;
	ulUnicodeRange2!: u32;
	ulUnicodeRange3!: u32;
	ulUnicodeRange4!: u32;
	/**
	 * Font Vendor Identification
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#achvendid
	 */
	achVendID!: string;
	/**
	 * Font selection flags.
	 * TODO: Enum
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#fsselection
	 */
	fsSelection!: u16;
	/**
	 * The minimum Unicode index (character code) in this font, according to the
	 * 'cmap' subtable for platform ID 3 and platform- specific encoding ID 0 or
	 * 1. For most fonts supporting Win-ANSI or other character sets, this value
	 * would be 0x0020. This field cannot represent supplementary character
	 * values (codepoints greater than 0xFFFF). Fonts that support supplementary
	 * characters should set the value in this field to 0xFFFF if the minimum
	 * index value is a supplementary character.
	 */
	usFirstCharIndex!: u16;
	/**
	 * The maximum Unicode index (character code) in this font, according to the
	 * 'cmap' subtable for platform ID 3 and encoding ID 0 or 1. This value
	 * depends on which character sets the font supports. This field cannot
	 * represent supplementary character values (codepoints greater than 0xFFFF).
	 * Fonts that support supplementary characters should set the value in this
	 * field to 0xFFFF.
	 */
	usLastCharIndex!: u16;
	/**
	 * The typographic ascender for this font. This field should be combined with
	 * the sTypoDescender and sTypoLineGap values to determine default line
	 * spacing.
	 *
	 * This field is similar to the
	 * {@linkcode HorizontalHeaderTable.ascender ascender} field in the `hhea`
	 * table as well as to the {@linkcode usWinAscent} field in this table.
	 * However, legacy platform implementations used those fields with
	 * platform-specific behaviors. As a result, those fields are constrained by
	 * backward-compatibility requirements, and they do not ensure consistent
	 * layout across implementations. The sTypoAscender, sTypoDescender and
	 * sTypoLineGap fields are intended to allow applications to lay out
	 * documents in a typographically-correct and portable fashion.
	 *
	 * The USE_TYPO_METRICS flag (bit 7) of the fsSelection field is used to
	 * choose between using sTypo* values or usWin* values for default line
	 * metrics. See {@linkcode fsSelection} for additional details.
	 *
	 * It is not a general requirement that sTypoAscender - sTypoDescender be
	 * equal to unitsPerEm. These values should be set to provide default line
	 * spacing appropriate for the primary languages the font is designed to
	 * support.
	 *
	 * For CJK (Chinese, Japanese, and Korean) fonts that are intended to be used
	 * for vertical (as well as horizontal) layout, the required value for
	 * sTypoAscender is that which describes the top of the [ideographic
	 * em-box](https://docs.microsoft.com/en-us/typography/opentype/spec/baselinetags#ideoembox).
	 * For example, if the ideographic em-box of the font extends from
	 * coordinates 0,-120 to 1000,880 (that is, a 1000 × 1000 box set 120 design
	 * units below the Latin baseline), then the value of sTypoAscender must be
	 * set to 880. Failing to adhere to these requirements will result in
	 * incorrect vertical layout.
	 *
	 * Also see the [Recommendations
	 * Section](https://docs.microsoft.com/en-us/typography/opentype/spec/recom#tad)
	 * for more on this field.
	 */
	sTypoAscender!: i16;
	/**
	 * The typographic descender for this font. This field should be combined
	 * with the sTypoAscender and sTypoLineGap values to determine default line
	 * spacing.
	 *
	 * This field is similar to the
	 * {@linkcode HorizontalHeaderTable.descender descender} field in the `hhea`
	 * table as well as to the {@linkcode usWinDescent} field in this table.
	 * However, legacy platform implementations used those fields with
	 * platform-specific behaviors. As a result, those fields are constrained by
	 * backward-compatibility requirements, and they do not ensure consistent
	 * layout across implementations. The sTypoAscender, sTypoDescender and
	 * sTypoLineGap fields are intended to allow applications to lay out
	 * documents in a typographically-correct and portable fashion.
	 *
	 * The USE_TYPO_METRICS flag (bit 7) of the fsSelection field is used to
	 * choose between using sTypo* values or usWin* values for default line
	 * metrics. See {@linkcode fsSelection} for additional details.
	 *
	 * It is not a general requirement that sTypoAscender - sTypoDescender be
	 * equal to unitsPerEm. These values should be set to provide default line
	 * spacing appropriate for the primary languages the font is designed to
	 * support.
	 *
	 * For CJK (Chinese, Japanese, and Korean) fonts that are intended to be used
	 * for vertical (as well as horizontal) layout, the required value for
	 * sTypoDescender is that which describes the bottom of the ideographic
	 * em-box. For example, if the [ideographic
	 * em-box](https://docs.microsoft.com/en-us/typography/opentype/spec/baselinetags#ideoembox)
	 * of the font extends from coordinates 0,-120 to 1000,880 (that is, a 1000 ×
	 * 1000 box set 120 design units below the Latin baseline), then the value of
	 * sTypoDescender must be set to -120. Failing to adhere to these
	 * requirements will result in incorrect vertical layout.
	 *
	 * Also see the [Recommendations
	 * Section](https://docs.microsoft.com/en-us/typography/opentype/spec/recom#tad)
	 * for more on this field.
	 */
	sTypoDescender!: i16;
	/**
	 * The typographic line gap for this font. This field should be combined with
	 * the sTypoAscender and sTypoDescender values to determine default line
	 * spacing.
	 *
	 * This field is similar to the
	 * {@linkcode HorizontalHeaderTable.lineGap lineGap} field in the `hhea`
	 * table. However, legacy platform implementations treat that field with
	 * platform-specific behaviors. As a result, that field is constrained by
	 * backward-compatibility requirements, and does not ensure consistent layout
	 * across implementations. The sTypoAscender, sTypoDescender and sTypoLineGap
	 * fields are intended to allow applications to lay out documents in a
	 * typographically-correct and portable fashion.
	 *
	 * The USE_TYPO_METRICS flag (bit 7) of the fsSelection field is used to
	 * choose between using sTypo* values or usWin* values for default line
	 * metrics. See {@linkcode fsSelection} for additional details.
	 */
	sTypoLineGap!: i16;
	/**
	 * The “Windows ascender” metric. This should be used to specify the height
	 * above the baseline for a clipping region.
	 *
	 * This is similar to the {@linkcode sTypoAscender} field, and also to the
	 * {@linkcode HorizontalHeaderTable.ascender ascender} field in the `hhea`
	 * table. There are important differences between these, however.
	 *
	 * In the Windows GDI implementation, the usWinAscent and usWinDescent values
	 * have been used to determine the size of the bitmap surface in the TrueType
	 * rasterizer. Windows GDI will clip any portion of a TrueType glyph outline
	 * that appears above the usWinAscent value. If any clipping is unacceptable,
	 * then the value should be set greater than or equal to yMax.
	 *
	 * _Note_: This pertains to the default position of glyphs, not their final
	 * position in layout after data from the GPOS or 'kern' table has been
	 * applied. Also, this clipping behavior also interacts with the
	 * {@link TODO VDMX table}: if a VDMX table is present and there is data for
	 * the current device aspect ratio and rasterization size, then the VDMX data
	 * will supersede the usWinAscent and usWinDescent values.
	 *
	 * Some legacy applications use the usWinAscent and usWinDescent values to
	 * determine default line spacing. This is strongly discouraged. The sTypo*
	 * fields should be used for this purpose.
	 *
	 * Note that some applications use either the usWin* values or the sTypo*
	 * values to determine default line spacing, depending on whether the
	 * USE_TYPO_METRICS flag (bit 7) of the fsSelection field is set. This may be
	 * useful to provide compatibility with legacy documents using older fonts,
	 * while also providing better and more-portable layout using newer fonts.
	 * See {@linkcode fsSelection} for additional details.
	 *
	 * Applications that use the sTypo* fields for default line spacing can use
	 * the usWin* values to determine the size of a clipping region. Some
	 * applications use a clipping region for editing scenarios to determine what
	 * portion of the display surface to re-draw when text is edited, or how
	 * large a selection rectangle to draw when text is selected. This is an
	 * appropriate use for the usWin* values.
	 *
	 * Early versions of this specification suggested that the usWinAscent value
	 * be computed as the yMax for all characters in the Windows “ANSI” character
	 * set. For new fonts, the value should be determined based on the primary
	 * languages the font is designed to support, and should take into
	 * consideration additional height that may be required to accommodate tall
	 * glyphs or mark positioning.
	 */
	usWinAscent!: u16;
	/**
	 * The “Windows descender” metric. This should be used to specify the
	 * vertical extent below the baseline for a clipping region.
	 *
	 * This is similar to the {@linkcode sTypoDescender} field, and also to the
	 * {@linkcode HorizontalHeaderTable.descender descender} field in the `hhea`
	 * table. There are important differences between these, however. Some of
	 * these differences are described below. In addition, the usWinDescent value
	 * treats distances below the baseline as positive values; thus, usWinDescent
	 * is usually a positive value, while sTypoDescender and hhea.descender are
	 * usually negative.
	 *
	 * In the Windows GDI implementation, the usWinDescent and usWinAscent values
	 * have been used to determine the size of the bitmap surface in the TrueType
	 * rasterizer. Windows GDI will clip any portion of a TrueType glyph outline
	 * that appears below (-1 × usWinDescent). If any clipping is unacceptable,
	 * then the value should be set greater than or equal to (-yMin).
	 *
	 * _Note_: This pertains to the default position of glyphs, not their final
	 * position in layout after data from the GPOS or 'kern' table has been
	 * applied. Also, this clipping behavior also interacts with the
	 * {@link TODO VDMX table}: if a VDMX table is present and there is data for
	 * the current device aspect ratio and rasterization size, then the VDMX data
	 * will supersede the usWinAscent and usWinDescent values.
	 *
	 * Some legacy applications use the usWinAscent and usWinDescent values to
	 * determine default line spacing. This is strongly discouraged. The sTypo*
	 * fields should be used for this purpose.
	 *
	 * Note that some applications use either the usWin* values or the sTypo*
	 * values to determine default line spacing, depending on whether the
	 * USE_TYPO_METRICS flag (bit 7) of the fsSelection field is set. This may be
	 * useful to provide compatibility with legacy documents using older fonts,
	 * while also providing better and more-portable layout using newer fonts.
	 * See {@linkcode fsSelection} for additional details.
	 *
	 * Applications that use the sTypo* fields for default line spacing can use
	 * the usWin* values to determine the size of a clipping region. Some
	 * applications use a clipping region for editing scenarios to determine what
	 * portion of the display surface to re-draw when text is edited, or how
	 * large a selection rectangle to draw when text is selected. This is an
	 * appropriate use for the usWin* values.
	 *
	 * Early versions of this specification suggested that the usWinDescent value
	 * be computed as -yMin for all characters in the Windows “ANSI” character
	 * set. For new fonts, the value should be determined based on the primary
	 * languages the font is designed to support, and should take into
	 * consideration additional vertical extent that may be required to
	 * accommodate glyphs with low descenders or mark positioning.
	 */
	usWinDescent!: u16;
	/**
	 * This field is used to specify the code pages encompassed by the font file
	 * in the 'cmap' subtable for platform 3, encoding ID 1 (Microsoft platform,
	 * Unicode BMP). If the font file is encoding ID 0, then the Symbol Character
	 * Set bit should be set.
	 *
	 * If a given bit is set (1), then the code page is considered functional. If
	 * the bit is clear (0) then the code page is not considered functional. Each
	 * of the bits is treated as an independent flag and the bits can be set in
	 * any combination. The determination of “functional” is left up to the font
	 * designer, although character set selection should attempt to be functional
	 * by code pages if at all possible.
	 *
	 * Symbol character sets have a special meaning. If the symbol bit (31) is
	 * set, and the font file contains a 'cmap' subtable for platform of 3 and
	 * encoding ID of 1, then all of the characters in the Unicode range 0xF000 -
	 * 0xF0FF (inclusive) will be used to enumerate the symbol character set. If
	 * the bit is not set, any characters present in that range will not be
	 * enumerated as a symbol character set.
	 *
	 * All reserved fields must be zero. Each uint32 is in Big-Endian form.
	 *
	 * TODO
	 */
	ulCodePageRange1?: u32;
	ulCodePageRange2?: u32;
	/**
	 * This metric specifies the distance between the baseline and the
	 * approximate height of non-ascending lowercase letters measured in FUnits.
	 * This value would normally be specified by a type designer but in
	 * situations where that is not possible, for example when a legacy font is
	 * being converted, the value may be set equal to the top of the unscaled and
	 * unhinted glyph bounding box of the glyph encoded at U+0078 (LATIN SMALL
	 * LETTER X). If no glyph is encoded in this position the field should be set
	 * to 0.
	 *
	 * This metric, if specified, can be used in font substitution: the xHeight
	 * value of one font can be scaled to approximate the apparent size of
	 * another.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#sxheight
	 */
	sxHeight?: i16;
	/**
	 * This metric specifies the distance between the baseline and the
	 * approximate height of uppercase letters measured in FUnits. This value
	 * would normally be specified by a type designer but in situations where
	 * that is not possible, for example when a legacy font is being converted,
	 * the value may be set equal to the top of the unscaled and unhinted glyph
	 * bounding box of the glyph encoded at U+0048 (LATIN CAPITAL LETTER H). If
	 * no glyph is encoded in this position the field should be set to 0.
	 *
	 * This metric, if specified, can be used in systems that specify type size
	 * by capital height measured in millimeters. It can also be used as an
	 * alignment metric; the top of a drop capital, for instance, can be aligned
	 * to the sCapHeight metric of the first line of text.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#scapheight
	 */
	sCapHeight?: i16;
	/**
	 * This is the Unicode code point, in UTF-16 encoding, of a character that
	 * can be used for a default glyph if a requested character is not supported
	 * in the font. If the value of this field is zero, glyph ID 0 is to be used
	 * for the default character. This field cannot represent supplementary-plane
	 * character values (code points greater than 0xFFFF), and so applications
	 * are strongly discouraged from using this field.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#usdefaultchar
	 */
	usDefaultChar?: u16;
	/**
	 * This is the Unicode code point, in UTF-16 encoding, of a character that
	 * can be used as a default break character. The break character is used to
	 * separate words and justify text. Most fonts specify U+0020 SPACE as the
	 * break character. This field cannot represent supplementary-plane character
	 * values (code points greater than 0xFFFF), and so applications are
	 * strongly discouraged from using this field.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#usbreakchar
	 */
	usBreakChar?: u16;
	/**
	 * The maximum length of a target glyph context for any feature in this font.
	 * For example, a font which has only a pair kerning feature should set this
	 * field to 2. If the font also has a ligature feature in which the glyph
	 * sequence “f f i” is substituted by the ligature “ffi”, then this field
	 * should be set to 3. This field could be useful to sophisticated
	 * line-breaking engines in determining how far they should look ahead to
	 * test whether something could change that affects the line breaking. For
	 * chaining contextual lookups, the length of the string (covered glyph) +
	 * (input sequence) + (lookahead sequence) should be considered.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#usmaxcontext
	 */
	usMaxContext?: u16;
	/**
	 * This field is used for fonts with multiple optical styles.
	 *
	 * This value is the lower value of the size range for which this font has
	 * been designed. The units for this field are TWIPs (one-twentieth of a
	 * point, or 1440 per inch). The value is inclusive — meaning that that font
	 * was designed to work best at this point size through, but not including,
	 * the point size indicated by usUpperOpticalPointSize. When used with other
	 * optical-size-variant fonts within a typographic family that also specify
	 * usLowerOpticalPointSize and usUpperOpticalPointSize values, it would be
	 * expected that another font has the usUpperOpticalPointSize field set to
	 * the same value as the value in this field, unless this font is designed
	 * for the lowest size range among the fonts in the family. The smallest font
	 * in an optical-size set should set this value to 0. When working across
	 * multiple optical-size-variant fonts within a typographic family, there
	 * should be no intentional gaps or overlaps in the ranges.
	 *
	 * The usLowerOpticalPointSize value must be less than
	 * usUpperOpticalPointSize. The maximum valid value is 0xFFFE.
	 *
	 * For fonts that were not designed for multiple optical-size variants, this
	 * field should be set to 0 (zero), and usUpperOpticalPointSize should be set
	 * to 0xFFFF.
	 *
	 * Note: Use of this field has been superseded by the STAT table. See
	 * [Recommendations
	 * Section](https://docs.microsoft.com/en-us/typography/opentype/spec/recom#OptSize)
	 * for more information.
	 *
	 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/os2#usloweropticalpointsize
	 */
	usLowerOpticalPointSize?: u16;
	/**
	 * This field is used for fonts with multiple optical styles.
	 *
	 * This value is the upper value of the size range for which this font has
	 * been designed. The units for this field are TWIPs (one-twentieth of a
	 * point, or 1440 per inch). The value is exclusive — meaning that that font
	 * was designed to work best below this point size down to the
	 * usLowerOpticalPointSize threshold. When used with other
	 * optical-size-variant fonts within a typographic family that also specify
	 * usLowerOpticalPointSize and usUpperOpticalPointSize values, it would be
	 * expected that another font has the usLowerOpticalPointSize field set to
	 * the same value as the value in this field, unless this font is designed
	 * for the highest size range among the fonts in the family. The largest font
	 * in an optical-size set should set this value to 0xFFFF, which is
	 * interpreted as infinity. When working across multiple optical-size-variant
	 * fonts within a typographic family, there should be no intentional gaps or
	 * overlaps left in the ranges.
	 *
	 * The usUpperOpticalPointSize value must be greater than
	 * usLowerOpticalPointSize. The minimum valid value for this field is 2
	 * (two). The largest possible inclusive point size represented by this field
	 * is 3276.65 points; any higher values would be represented as infinity.
	 *
	 * For fonts that were not designed for multiple optical-size variants, this
	 * field should be set to 0xFFFF, and usLowerOpticalPointSize should be set
	 * to 0 (zero).
	 *
	 * Note: Use of this field has been superseded by the STAT table. See
	 * [Recommendations
	 * Section](https://docs.microsoft.com/en-us/typography/opentype/spec/recom#OptSize)
	 * for more information.
	 */
	usUpperOpticalPointSize?: u16;
}

/**
 * The OS/2 table consists of a set of metrics and other data that are required
 * in OpenType fonts.
 *
 * Six versions of the OS/2 table have been defined: versions 0 to 5. All
 * versions are supported, but use of version 4 or later is strongly
 * recommended.
 */
export type OS2<V extends OS2Version>
	= V extends 0 ? OS2_v0
	: V extends 1 ? OS2_v1
	: V extends 2 ? OS2_v2
	: V extends 3 ? OS2_v3
	: V extends 4 ? OS2_v4
	: V extends 5 ? OS2_v5
	: never;

export type OS2_v0 = Transparent<
	{ version: 0; }
	& Required<Pick<OS2Table,
		| "xAvgCharWidth"
		| "usWeightClass"
		| "usWidthClass"
		| "fsType"
		| "ySubscriptXSize"
		| "ySubscriptYSize"
		| "ySubscriptXOffset"
		| "ySubscriptYOffset"
		| "ySuperscriptXSize"
		| "ySuperscriptYSize"
		| "ySuperscriptXOffset"
		| "ySuperscriptYOffset"
		| "yStrikeoutSize"
		| "yStrikeoutPosition"
		| "sFamilyClass"
		| "panose"
		| "ulUnicodeRange1"
		| "ulUnicodeRange2"
		| "ulUnicodeRange3"
		| "ulUnicodeRange4"
		| "achVendID"
		| "fsSelection"
		| "usFirstCharIndex"
		| "usLastCharIndex"
		| "sTypoAscender"
		| "sTypoDescender"
		| "sTypoLineGap"
		| "usWinAscent"
		| "usWinDescent"
	>>
>;

export type OS2_v1 = Transparent<
	{ version: 1; }
	& Omit<OS2_v0, "version">
	& Required<Pick<OS2Table,
		| "ulCodePageRange1"
		| "ulCodePageRange2"
	>>
>;

export type OS2_v2 = Transparent<
	{ version: 2; }
	& Omit<OS2_v1, "version">
	& Required<Pick<OS2Table,
		| "sxHeight"
		| "sCapHeight"
		| "usDefaultChar"
		| "usBreakChar"
		| "usMaxContext"
	>>
>;

export type OS2_v3 = Transparent<
	{ version: 3; }
	& Omit<OS2_v2, "version">
>;

export type OS2_v4 = Transparent<
	{ version: 4; }
	& Omit<OS2_v2, "version">
>;

export type OS2_v5 = Transparent<
	{ version: 5; }
	& Omit<OS2_v2, "version">
	& Required<Pick<OS2Table,
		| "usLowerOpticalPointSize"
		| "usUpperOpticalPointSize"
	>>
>;

interface HMetricParams {
	width: number;
	lsb: number;
}

export class HMetric {
	constructor ({ width, lsb }: HMetricParams) {
		this.width = width;
		this.lsb = lsb;
	}

	/** Advance width, in font design units. */
	width: number;
	/** Glyph left side bearing, in font design units. */
	lsb: number;
}

export interface CaretSlope {
	/** Used to calculate the slope of the cursor (rise/run); 1 for vertical. */
	rise: i16;
	/** 0 for vertical. */
	run: i16;
}

export interface Range<N extends number> {
	min: N;
	max: N;
}
