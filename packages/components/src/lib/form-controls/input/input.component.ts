import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Input,
	ViewEncapsulation,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

import { Coerce } from "@electric/ng-utils";
import { Fn, match } from "@electric/utils";

import {
	NativeControl,
	NATIVE_CONTROL,
	ValueAccessor,
} from "../form-controls.types";

export type InputType =
	| "text"
	| "email"
	| "number"
	| "password"
	| "search"
	| "tel"
	| "url";

@Component({
	selector: "input[elx-input], textarea[elx-input]",
	template: ``,
	styleUrls: ["./input.component.scss"],
	providers: [{
		provide: NATIVE_CONTROL,
		useExisting: InputComponent,
	}, {
		provide: NG_VALUE_ACCESSOR,
		useExisting: InputComponent,
		multi: true,
	}],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent<T extends string|number>
implements NativeControl, ValueAccessor<T> {
	@HostBinding("class")
	readonly hostClass = "elx-input";

	@Input("elx-input")
	get type() { return this._type; }
	set type(value) {
		if (value) {
			this._type = value;
			if (this._element instanceof HTMLInputElement)
				this._element.type = value;
		}
	}
	private _type: InputType = "text";

	@HostBinding("attr.id")
	@Input("id")
	fieldId?: string;

	@HostBinding("disabled")
	@Coerce(Boolean)
	@Input() disabled = false;

	private _deferredValueChange?: T;
	private _deferredOnTouch?: boolean;

	private get _element() { return this._elementRef.nativeElement; }

	constructor (
		private _elementRef: ElementRef<HTMLInputElement>,
	) {}

	@HostListener("input")
	_onInput(): void {
		let element = this._element;
		let value = match(this.type, {
			number: () => parseFloat(element.value),
			tel: () => parseInt(element.value, 10),
			_: () => element.value,
		});

		this.onChange(value as T);
	}

	writeValue(value?: T): void {
		this._element.value = value?.toString() ?? "";
	}

	private onChange = (value?: T) => {
		this._deferredValueChange = value;
	}

	registerOnChange(fn: Fn<[T?], void>): void {
		this.onChange = fn;

		if (this._deferredValueChange) {
			fn(this._deferredValueChange);
		}
	}

	@HostListener("blur")
	_onTouched = () => {
		this._deferredOnTouch = true;
	}

	registerOnTouched(fn: Fn<[], void>): void {
		this._onTouched = fn;

		if (this._deferredOnTouch) {
			fn();
		}
	}

	setDisabledState(value: boolean): void {
		this.disabled = value;
	}
}
