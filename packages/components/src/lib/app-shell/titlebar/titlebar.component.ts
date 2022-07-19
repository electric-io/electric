import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	Output,
	EventEmitter,
	HostBinding,
	Directive,
	TemplateRef,
	ContentChild,
	forwardRef,
	Optional,
	Inject,
} from "@angular/core";

import { APP_PLATFORM, AppPlatform } from "@electric/platform";

@Component({
	selector: "elx-titlebar",
	template: `

<div class="elx-titlebar__icon"
	*ngIf="_icon != null"
>
	<ng-template [ngTemplateOutlet]="_icon!.templateRef"></ng-template>
</div>

<ng-content select="elx-menubar"></ng-content>

<div class="elx-titlebar__title"
	*ngIf="title != null;
	else projectedTitle"
>
	{{ title }}
</div>
<ng-template #projectedTitle>
	<ng-content select="[elxTitlebarTitle]"></ng-content>
</ng-template>

<ng-content></ng-content>

<div class="elx-window-controls">
	<div class="elx-window-controls__button"
		(click)="minimize.emit()"
	>
		<elx-icon icon="WindowsMinimize"></elx-icon>
	</div>
	<div class="elx-window-controls__button"
		(click)="maximizedChange.emit(!maximized)"
	>
		<elx-icon
			[icon]="maximized ? 'WindowsRestore' : 'WindowsMaximize'"
		></elx-icon>
	</div>
	<div
		class="elx-window-controls__button
		       elx-window-controls__button--close"
		(click)="close.emit()"
	>
		<elx-icon icon="WindowsClose"></elx-icon>
	</div>
</div>

	`,
	styleUrls: ["./titlebar.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitlebarComponent {
	@HostBinding("class")
	readonly hostClass = "elx-titlebar";

	@HostBinding("attr.role")
	readonly role = "banner";

	@HostBinding("attr.title")
	readonly _titleFix = null;

	@HostBinding("attr.data-tauri-drag-region")
	get tauriDragRegion() {
		return this._platform === AppPlatform.Tauri ? "" : null;
	}

	@HostBinding("style.-webkit-app-region")
	get webkitAppRegion() {
		return this._platform === AppPlatform.Electron ? "drag" : null;
	}

	@Input() title?: string;
	@Input() maximized = false;

	@Output() maximizedChange = new EventEmitter<boolean>();
	@Output() minimize = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();

	@ContentChild(forwardRef(() => TitlebarIconDirective))
	_icon?: TitlebarIconDirective;

	constructor (
		@Optional() @Inject(APP_PLATFORM)
			private _platform: AppPlatform,
	) {}
}

@Directive({
	selector: "[elxTitlebarIcon]",
})
export class TitlebarIconDirective {
	constructor (
		public templateRef: TemplateRef<void>,
	) {}
}
