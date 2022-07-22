import { Injectable } from "@angular/core";
import { match } from "@electric/utils";
import type { HighlightOptions, HighlightResult, HLJSApi, LanguageFn } from "highlight.js";

@Injectable({
	providedIn: "root"
})
export class HighlightService {
	private _hljs: Promise<HLJSApi>;
	private _registeredLanguages = new Set<string>();

	constructor () {
		this._hljs = import("highlight.js/lib/core").then(mod => mod.default);
	}

	async highlight(
		src: string,
		options: HighlightOptions,
	): Promise<HighlightResult> {
		let hljs = await this._hljs;

		if (!this._registeredLanguages.has(options.language)) {
			const { default: lang }: { default: LanguageFn } = await match(options.language, {
				html:       () => import("./languages/html.language"),
				typescript: () => import("./languages/ts.language"),
				scss:       () => import("highlight.js/lib/languages/scss"),
				_: () => {
					throw new Error(`No handler for language '${options.language}'`);
				},
			});
			hljs.registerLanguage(options.language, lang);

			this._registeredLanguages.add(options.language);
		}

		return hljs.highlight(src, options);
	}
}
