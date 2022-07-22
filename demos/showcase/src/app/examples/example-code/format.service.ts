import { Injectable } from "@angular/core";
import { match } from "@electric/utils";
import type { CursorOptions, CursorResult, Options, Plugin } from "prettier";

interface Prettier {
	formatWithCursor(source: string, options: CursorOptions): CursorResult;
	format(source: string, options?: Options): string;
	check(source: string, options?: Options): boolean;
}

@Injectable({
	providedIn: "root",
})
export class CodeFormatService {
	private _prettier: Promise<Prettier>;
	private _loadedPlugins = new Map<string, Plugin[]>();

	constructor () {
		this._prettier = import("prettier");
	}

	async fmt(src: string, options: Options): Promise<string> {
		let prettier: Prettier = await this._prettier;

		if (!this._loadedPlugins.has(options.parser as string)) {
			await match(options.parser as string, {
				angular: async () => {
					let plugins = await Promise.all([
						import("prettier/parser-angular"),
						import("prettier/parser-html"),
					]);
					this._loadedPlugins.set("angular", plugins);
				},
				scss: async () => {
					let plugins = [await import("prettier/parser-postcss")];
					this._loadedPlugins.set("scss", plugins);
				},
				typescript: async () => {
					let plugins = [await import("prettier/parser-typescript")];
					this._loadedPlugins.set("typescript", plugins);
				},
			});
		}

		options.plugins = this._loadedPlugins.get(options.parser as string);

		return prettier.format(src, options);
	}
}
