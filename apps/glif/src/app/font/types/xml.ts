export class XmlElement {
	static from(dom: Element): XmlElement {
		return new XmlElement(dom);
	}

	private dom: Element;
	private constructor (dom: Element) {
		this.dom = dom;
	}
}

interface Serde<T> {
	read(value: string): T;
	write(value: T): string;
	new (): {};
}

export const float: Serde<number> = class {
	static read(value: string): number {
		return parseFloat(value);
	}
	static write(value: number): string {
		return value.toString(10);
	}
}

export const int: Serde<number> = class {
	static read(value: string): number {
		return parseInt(value, 10);
	}
	static write(value: number): string {
		return value.toString(10);
	}
}

export const hex: Serde<number> = class {
	static read(value: string): number {
		return parseInt(value, 16);
	}
	static write(value: number): string {
		return `0x${value.toString(16)}`;
	}
}

export function flags<T extends number>(): Serde<T> {
	return class {
		static read(value: string): T {
			return parseInt(value.replace(/ /g, ""), 2) as T;
		}
		static write(value: T): string {
			return value
				.toString(2)
				.replace(/([01]{4})/g, "$1 ")
				.trim();
		}
	}
}

export const str: Serde<string> = class {
	static read(value: string): string {
		return value;
	}
	static write(value: string): string {
		return value;
	}
}

export const date: Serde<Date> = class {
	static read(value: string): Date {
		return new Date(value);
	}
	static write(value: Date): string {
		throw new Error("TODO");
	}
}

export const u32version: Serde<number> = class {
	// Note: This is faster than just processing the whole u32 using BigInts:
	// https://measurethat.net/Benchmarks/Show/19996/0/parse-32-bit-hex-bigint-vs-regex-parseint#latest_results_block
	static read(value: string): number {
		let [major, minor] = value
			.match(/0x([0-9a-f]{4})([0-9a-f]{4})/i)!
			.slice(1)
			.map(n => parseInt(n, 16));

		while (minor >= 1)
			minor /= 10;

		return Math.round((major + minor) * 1e5) / 1e5;
	}

	static write(value: number): string {
		let minor = Math.round((value % 1) * 1e5);
		const major = Math.round(value - (minor / 1e5));

		while (minor && !(minor % 10))
			minor /= 10;

		const hexify = (n: number) => n
			.toString(16)
			.padStart(4, "0")
			.toUpperCase();

		return `0x${hexify(major)}${hexify(minor)}`;
	}
}

export function serde<V>({ read, write }: Serde<V>) {
	return <T extends XmlElement, K extends string & keyof T>(target: T, key: K) => {
		Object.defineProperty(target, key, {
			get(this: T): V {
				return read(this["dom"].getAttribute(key)!);
			},
			set(this: T, value: V): void {
				this["dom"].setAttribute(key, write(value));
			},
		})
	}
}
