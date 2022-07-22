import { invoke } from "@tauri-apps/api/tauri";

namespace tauri {
	export function parseFontToXml(fontPath: string): Promise<string> {
		return invoke("parse_font_to_xml", { fontPath });
	}
}
export default tauri;
