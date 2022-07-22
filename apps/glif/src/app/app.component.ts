import { Component, Inject } from "@angular/core";
import { WindowProvider, WINDOW_PROVIDER } from "@electric/platform";
import * as dialog from "@tauri-apps/api/dialog";

import { Font } from "./font";
import { ProjectService } from "./project.service";

@Component({
	selector: "g-root",
	template: `

<elx-app-shell
	fakeWindowsChrome
	[maximized]="maximized"
>
	<elx-titlebar
		(minimize)="minimize()"
		[(maximized)]="maximized"
		(close)="close()"
	>
		<img *elxTitlebarIcon
			src="assets/favicon.ico"
			alt="Glif Favicon"
		/>

		<elx-menubar>
			<elx-menuitem [elxMenuTriggerFor]="fileMenu">
				File
			</elx-menuitem>
			<elx-menuitem disabled>
				Edit
			</elx-menuitem>
			<elx-menuitem disabled>
				Help
			</elx-menuitem>
		</elx-menubar>

		<div class="title" elxTitlebarTitle>
			<span class="title__app">Glif</span>
			<ng-container *ngIf="(_project.name$ | async) as projectName">
				<em class="title__sep">/</em>
				<span class="title__project">{{ projectName }}</span>
			</ng-container>
		</div>
	</elx-titlebar>

	<elx-menu #fileMenu>
		<elx-menuitem icon="NewFolder" keybind="Ctrl + N"
			(click)="_project.create()"
		>
			New Project...
		</elx-menuitem>
		<elx-menuitem icon="FolderOpen" keybind="Ctrl + O"
			(click)="_project.open()"
		>
			Open Project...
		</elx-menuitem>
		<elx-menuitem disabled>
			Recent Projects
		</elx-menuitem> <!-- TODO -->
		<hr />
		<!-- [disabled]="!(_project.home$ | async)" -->
		<elx-menuitem (click)="importFont()">
			Import Font...
		</elx-menuitem>
	</elx-menu>

	<elx-main-viewport class="main">

		<button elx-btn="primary"
			(click)="importFont()"
		>
			Get Started
		</button>

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
		public _project: ProjectService,
	) {}

	async minimize() {
		await this._win.minimize();
	}

	async close() {
		await this._win.close();
	}

	async importFont() {
		try {
			const result = await dialog.open({
				title: "Import Font(s)",
				directory: false,
				multiple: true,
				filters: [{
					name: "Font Files",
					extensions: ["otf", "ttf"],
				}],
			});

			if (!result) return;

			if (Array.isArray(result)) {
				const fonts = await Promise.all(result.map(Font.fromFile));
				for (let font of fonts)
					console.log(font);
			}
			else {
				const font = await Font.fromFile(result);
				console.log(font);
			}
		}
		catch (err) {
			console.error(err);
		}
	}
}
