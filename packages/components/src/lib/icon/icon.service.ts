import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";

import { SvgIcon } from "@electric/style";
import { entries } from "@electric/utils";

import { ICON_LIBRARY } from "./icon.types";

@Injectable()
export class IconRegistry {
	private _svgMap = new Map<string, SvgIcon>();

	constructor (
		@Inject(DOCUMENT) private _document: Document,
		@Inject(ICON_LIBRARY) icons: Record<string, string>,
	) {
		this.register(icons);
	}

	has(id: string) {
		return this._svgMap.has(id);
	}

	get(id: string) {
		let svg = this._svgMap.get(id);
		if (!svg) return null;

		svg.validate();

		return svg.content;
	}

	private register(icons: Record<string, string>) {
		for (let [id, content] of entries(icons)) {
			this._svgMap.set(id, new SvgIcon(content, this._document));
		}
	}
}
