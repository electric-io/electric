import { f32, int } from "./font.types";

export function parsef32(element: Element): f32 {
	return parseFloat(element.getAttribute("value")!);
}

export function parseDecimal(element: Element): int {
	return parseInt(element.getAttribute("value")!, 10);
}

export function parseHex(element: Element): int {
	return parseInt(element.getAttribute("value")!, 16);
}

export function parseFlags<T extends int>(element: Element): T {
	return parseInt(element.getAttribute("value")!.replace(/ /g, ""), 2) as T;
}

export function readString(element: Element): string {
	return element.getAttribute("value")!;
}

export function parseDate(element: Element): Date {
	return new Date(element.getAttribute("value")!);
}

export function parseu32version(element: Element): f32 {
	const value_u32 = parseHex(element);
	const minor_u16 = value_u32 & ~0xFFFF_0000;
	const major_u16 = (value_u32 & ~0x0000_FFFF) >> 16;

	return parseFloat(`${major_u16}.${minor_u16}`);
}
