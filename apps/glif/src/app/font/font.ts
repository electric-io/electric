import { match } from "@electric/utils";

import {
	FontHeaderTable,
	HorizontalHeaderTable,
	HorizontalMetricsTable,
	OS2Table,
} from "./types";
import tauri from "../tauri.bridge";

export class Font {
	static parser = new DOMParser();

	static async fromFile(path: string): Promise<Font> {
		const xml = await tauri.parseFontToXml(path);
		const doc = Font.parser.parseFromString(xml, "text/xml");

		const fontEl = doc.querySelector("ttFont");
		if (!fontEl) throw new Error("Expected document > ttFont element");

		const result = new Font();
		for (let i = 0; i < fontEl.childElementCount; ++i) {
			const child = fontEl.children[i];
			match(child.nodeName, {
				head: () => result._head = FontHeaderTable.fromXml(child),
				hhea: () => result._hhea = HorizontalHeaderTable.fromXml(child),
				hmtx: () => result._hmtx = HorizontalMetricsTable.fromXml(child),
				OS_2: () => result._OS_2 = OS2Table.fromXml(child),
				_: () => {
					console.warn(`Unhandled font table: "${child.nodeName}"`);
				},
			});
		}

		return result;
	}

	private _head!: FontHeaderTable;
	private _hhea!: HorizontalHeaderTable;
	private _hmtx!: HorizontalMetricsTable;
	private _OS_2!: OS2Table;

	private constructor () {}
}
