import { invoke } from "@tauri-apps/api/tauri";

export interface LoadFontParams {
	fontPath: string;
	projectPath: string;
}

namespace tauri {
	export function loadFont({ fontPath, projectPath }: LoadFontParams): Promise<void> {
		return invoke("load_font", { fontPath, projectPath });
	}
}
export default tauri;
