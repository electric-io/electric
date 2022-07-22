import { u32version } from "./xml";

describe("xml", () => {
	describe("serde", () => {
		describe("u32version", () => {
			test("read", () => {
				expect(u32version.read("0x00010000")).toBe(1.0);
				expect(u32version.read("0x0001FFFF")).toBe(1.65535);
				expect(u32version.read("0x0001013A")).toBe(1.314);
			});

			test("write", () => {
				expect(u32version.write(1.0)).toBe("0x00010000");
				expect(u32version.write(1.65535)).toBe("0x0001FFFF");
				expect(u32version.write(1.314)).toBe("0x0001013A");
				expect(u32version.write(57020.31525)).toBe("0xDEBC7B25");
			});

			test("e2e", () => {
				for (let i = 0; i < 1000; ++i) {
					const major = Math.round(Math.random() * 65535);
					const minor = Math.round(Math.random() * 65535);
					const version = parseFloat(`${major}.${minor}`);

					expect(u32version.read(u32version.write(version))).toBe(version);
				}
			});
		});
	});
});
