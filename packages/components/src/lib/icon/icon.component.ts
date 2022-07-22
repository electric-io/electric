import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	ElementRef,
	isDevMode,
	HostBinding,
} from "@angular/core";

import { a11y } from "@electric/style";
import { camelToKebabCase, match } from "@electric/utils";

import { IconRegistry } from "./icon.service";
import { IconName, IconSize } from "./icon.types";

@Component({
	selector: "elx-icon",
	template: "",
	styleUrls: ["./icon.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
	@Input()
	get icon() { return this._icon; }
	set icon(value) {
		this._icon = value;
		if (value) this.render();
	}
	private _icon?: IconName;

	@Input() size: IconSize = "md";

	@HostBinding("class")
	get hostClasses() {
		let base = "elx-icon";
		let iconClass = this.icon
			? `${base}--${camelToKebabCase(this.icon)}`
			: "";
		return [base, iconClass];
	}

	@HostBinding("attr.aria-hidden")
	readonly ariaHidden = "true";

	@HostBinding("style.fontSize")
	get fontSize() {
		return match(this.size, {
			xs: () => a11y.rem(16),
			sm: () => a11y.rem(18),
			md: () => a11y.rem(20),
			lg: () => a11y.rem(24),
		});
	}

	private get _element() {
		return this._elementRef.nativeElement;
	}

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _registry: IconRegistry,
	) {}

	private render(): void {
		if (this._registry.has(this.icon!)) {
			this._element.innerHTML = this._registry.get(this.icon!)!;
		} else if (isDevMode()) {
			console.warn(`No definition found for icon '${this.icon}'!`);
		}
	}
}
