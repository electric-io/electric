import { Component, Inject } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";

@Component({
	selector: "g-root",
	template: `

<elx-app-shell
	fakeWindowsChrome
	[maximized]="maximized"
>
	<elx-titlebar
		title="Glif"
		(minimize)="minimize()"
		[(maximized)]="maximized"
		(close)="close()"
	>
		<img *elxTitlebarIcon
			src="assets/favicon.ico"
			alt="Glif Favicon"
		/>
	</elx-titlebar>

	<elx-main-viewport class="main">

	</elx-main-viewport>
</elx-app-shell>

	`,
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	get maximized() { return this._win.maximized }
	set maximized(_) { this._win.toggleMaximized() }

	constructor (
		@Inject(WINDOW_PROVIDER) private _win: WindowProvider,
	) {}

	async minimize() {
		await this._win.minimize();
	}

	async close() {
		await this._win.close();
	}
}
