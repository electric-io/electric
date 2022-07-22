import { Pipe, PipeTransform } from "@angular/core";
// FIXME: This crap adds ~4 MB to the bundle size
import * as prettier from "prettier/standalone";
import * as prettierHtml from "prettier/parser-html";
import * as prettierNg from "prettier/parser-angular";
import * as prettierTs from "prettier/parser-typescript";
import * as prettierScss from "prettier/parser-postcss";

import { exists, match } from "@electric/utils";

import { Defaults } from "../examples.types";
import { HTML_IDENT } from "./languages/common";
import { regex } from "./languages/util";
import { HighlightService } from "./highlight.service";

@Pipe({ name: "highlight" })
export class HighlightPipe implements PipeTransform {
	constructor (
		private _highlighter: HighlightService,
	) {}

	async transform(markup: string, language: string): Promise<string> {
		return this._highlighter
			.highlight(markup, { language })
			.then(result => result.value);
	}
}

@Pipe({ name: "lines" })
export class LinesPipe implements PipeTransform {
	transform(src?: string): string[] {
		return src?.split("\n") ?? [];
	}
}

@Pipe({ name: "stripIndents" })
export class StripIndentsPipe implements PipeTransform {
	transform(lines?: string[]): string[] {
		if (!lines) return [];

		let leadingIndent = lines
			.find(line => !/^\s*$/.test(line))
			?.match(/^\t+/)?.[0]
			?? "";

		return lines.map(line => line.replace(leadingIndent, ""));
	}
}

@Pipe({ name: "stripDefaults" })
export class StripDefaultsPipe implements PipeTransform {
	transform(lines?: string[], defaults?: Defaults): string[] {
		if (!lines) return [];
		if (!defaults) return lines;

		return lines
			.map(line => {
				let match = line.match(regex`/(${HTML_IDENT})="([^"]*)"/`);
				if (!match) return line;

				let [_, key, matchValue] = match;
				let options = defaults[key];

				if (!options) return line;

				let value = typeof options === "object"
					? options.value
					: options;

				if (matchValue === value) {
					if (typeof options === "object" && options.keepAttr) {
						return line.replace(/="([^"]*)"/, "");
					}
					return null;
				}

				return line;
			})
			.filter(exists);
	}
}

@Pipe({ name: "fmt" })
export class FormatCodePipe implements PipeTransform {
	transform(lines?: string[], language?: string): string[] {
		if (!lines) return [];
		return prettier
			.format(lines.join("\n"), this.optionsFor(language!))
			.split("\n");
	}

	private optionsFor(language: string) {
		return match(language, {
			html: () => ({
				parser: "angular",
				useTabs: true,
				printWidth: 50,
				plugins: [
					prettierHtml,
					prettierNg,
				],
			}),
			scss: () => ({
				parser: "scss",
				useTabs: true,
				plugins: [
					prettierScss,
				],
			}),
			typescript: () => ({
				parser: "typescript",
				useTabs: true,
				plugins: [
					prettierTs,
				],
			}),
			_: () => {
				throw new Error();
			},
		});
	}
}

@Pipe({ name: "joinLines" })
export class JoinLinesPipe implements PipeTransform {
	transform(lines?: string[]): string {
		if (!lines) return "";
		return lines.join("\n");
	}
}
