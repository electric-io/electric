import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppShellModule, DEFAULT_THEME, IconModule, ThemeModule, ThemeService } from "@electric/components";
import { AppPlatform, PlatformModule } from "@electric/platform";
import { ICONS } from "@electric/style";

import { AppComponent } from "./app.component";

@NgModule({
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		AppShellModule,
		IconModule.withIcons(ICONS),
		PlatformModule.forPlatform(AppPlatform.Tauri),
		ThemeModule.withTheme(DEFAULT_THEME, "dark"),
	],
	declarations: [
		AppComponent,
	],
	bootstrap: [
		AppComponent,
	],
})
export class AppModule {
	constructor (private _: ThemeService) {}
}
