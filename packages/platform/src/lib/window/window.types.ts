import { InjectionToken } from "@angular/core";
import { match } from "@electric/utils";
import { Observable } from "rxjs";

import { AppPlatform } from "../platform.types";
import { ElectronWindowService } from "./electron-window.service";
import { NoopWindowService } from "./noop-window.service";
import { TauriWindowService } from "./tauri-window.service";

export interface WindowProvider {
	readonly maximized$: Observable<boolean>;
	readonly maximized: boolean;

	minimize(): Promise<void>;
	close(): Promise<void>;
	toggleMaximized(): Promise<boolean>;
}

export const WINDOW_PROVIDER = new InjectionToken<WindowProvider>("WindowProvider");

export function WindowProviderFactory(platform: AppPlatform): WindowProvider {
	return match(platform, {
		[AppPlatform.Electron]: () => new ElectronWindowService(),
		[AppPlatform.Tauri]: () => new TauriWindowService(),
		[AppPlatform.Web]: () => new NoopWindowService(),
	});
}
