import {
	ActiveDescendantKeyManager,
	FocusMonitor,
	Highlightable,
} from "@angular/cdk/a11y";
import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	HostBinding,
	HostListener,
	ContentChildren,
	ViewChild,
	ViewContainerRef,
	AfterContentInit,
	OnDestroy,
	ElementRef,
	TemplateRef,
	OnInit,
	forwardRef,
	Self,
	NgZone,
	Injector,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import {
	filter,
	firstValueFrom,
	map,
	mapTo,
	merge,
	share,
	startWith,
	Subject,
	switchMap,
	take,
	takeUntil,
} from "rxjs";

import { Coerce, DetectChanges, QueryList } from "@electric/ng-utils";
import { array, elementId, Fn, fromKeydown } from "@electric/utils";

import {
	FieldSet,
	FIELD_SET,
	ValueAccessor,
} from "../form-controls.types";
import { Option, OPTION } from "./select.types";
import { SelectOverlayManager } from "./select-overaly.service";
import { OptionListComponent } from "./option-list/option-list.component";
import { OverlayData } from "./select-overlay-data.service";

const FIELD_SET_PROVIDER = {
	provide: FIELD_SET,
	useExisting: forwardRef(() => SelectComponent),
};

const VALUE_ACCESSOR_PROVIDER = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => SelectComponent),
	multi: true,
};

@Component({
	selector: "elx-select",
	template: `

<span class="
		elx-select__value
		elx-select__value--placeholder"
	*ngIf="!value"
>{{ placeholder }}</span>

<span class="elx-select__value">
	<ng-container #outlet></ng-container>
</span>

<div class="elx-select__icon">
	<elx-icon
		icon="ChevronDownSmall"
		size="sm"
	></elx-icon>
</div>

<div class="elx-select__hidden-options"
	[id]="_optionListId"
	*ngIf="!_menuOpen"
>
	<ng-template
		[ngTemplateOutlet]="optionsTemplate"
	></ng-template>
</div>

<ng-template #optionsTemplate>
	<ng-content></ng-content>
</ng-template>

	`,
	styleUrls: ["./select.component.scss"],
	providers: [
		FIELD_SET_PROVIDER,
		VALUE_ACCESSOR_PROVIDER,
		OverlayData,
		SelectOverlayManager,
	],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent<T>
implements
	FieldSet,
	ValueAccessor<T>,
	OnInit,
	AfterContentInit,
	OnDestroy
{
	@HostBinding("class")
	readonly hostClass = "elx-select";

	@HostBinding("attr.role")
	readonly role = "listbox";

	@HostBinding("attr.aria-labeledby")
	@DetectChanges()
	labelId?: string;

	@HostBinding("attr.aria-orientation")
	readonly orientation = "vertical";

	@HostBinding("attr.aria-activedescendant")
	@DetectChanges()
	activeDescendant?: string;

	@HostBinding()
	get tabIndex() {
		if (this.disabled) return -1;
		return 0;
	}

	@Input() placeholder = "None";

	@HostBinding("attr.aria-disabled")
	@HostBinding("class.disabled")
	@Coerce(Boolean)
	@DetectChanges()
	@Input() disabled?: boolean;

	@DetectChanges() value?: T;

	@HostBinding("attr.aria-owns")
	_optionListId = elementId("option-list");

	@HostBinding("class.menu-open")
	@DetectChanges()
	_menuOpen = false;

	private _optionList?: OptionListComponent;

	@ContentChildren(OPTION)
	private _options?: QueryList<Highlightable & Option<T>>;

	@ViewChild("outlet", { read: ViewContainerRef, static: true })
	private _outlet!: ViewContainerRef;

	@ViewChild("optionsTemplate", { read: TemplateRef, static: true })
	private _optionsTemplate!: TemplateRef<void>;

	private _keyManager?: ActiveDescendantKeyManager<Option<T>>;

	private _deferredValueChange?: T;
	private _deferredOnTouch?: boolean;

	private _menuClose$ = new Subject<void>();
	private _onDestroy$ = new Subject<void>();

	constructor (
		private _elementRef: ElementRef<HTMLElement>,
		private _focusMonitor: FocusMonitor,
		private _injector: Injector,
		@Self() private _overlayData: OverlayData,
		@Self() private _overlay: SelectOverlayManager,
		private _viewContainer: ViewContainerRef,
		private _zone: NgZone,
	) {}

	// #region Angular lifecycle ------------------------------------------------

	ngOnInit(): void {
		let focusChanges$ = this._focusMonitor
			.monitor(this._elementRef)
			.pipe(share());

		// Select the first value automatically on keyboard focus
		focusChanges$.pipe(
			filter(origin => origin === "keyboard"),
			takeUntil(focusChanges$.pipe(
				filter(origin => origin === null),
			)),
			takeUntil(this._onDestroy$),
		).subscribe(() => {
			if (!this.value) {
				this._keyManager?.setFirstItemActive();
			}
		});

		// Pipe keydown events to key-manager while focused
		focusChanges$.pipe(
			filter(origin => origin !== null),
			takeUntil(focusChanges$.pipe(
				filter(origin => origin === null),
			)),
			switchMap(() => fromKeydown(this._elementRef)),
			takeUntil(this._onDestroy$),
		).subscribe(event => {
			this._keyManager!.onKeydown(event);
		});
	}

	ngAfterContentInit(): void {
		// Init key manager
		this._keyManager = new ActiveDescendantKeyManager(this._options!)
			.withVerticalOrientation(true)
			.withWrap(true)
			.withHomeAndEnd(true)
			.withTypeAhead();

		// Invoke change handler when key manager signals active item change
		this._overlayData.optionHeight = 32; // TODO
		this._overlayData.connect(this._keyManager.change);
		this._keyManager.change.pipe(
			map(idx => this._options!.get(idx)!),
			takeUntil(this._onDestroy$),
		).subscribe(option => {
			this.onOptionChange(option);
		});

		// Set active item via key manager when an option is clicked
		this._options!.changes.pipe(
			startWith(this._options!),
			switchMap(options =>
				merge(...options.map((option, idx) =>
					option.select.pipe(mapTo(idx))
				))
			),
			takeUntil(this._onDestroy$),
		).subscribe(idx => {
			this._keyManager?.setActiveItem(idx);
		});
	}

	ngOnDestroy(): void {
		this._focusMonitor.stopMonitoring(this._elementRef);
		this._onDestroy$.next();
		this._onDestroy$.complete();
		this._menuClose$.complete();
	}

	// #endregion Angular lifecycle ---------------------------------------------

	// #region ValueAccessor impl -----------------------------------------------

	writeValue(value?: T): void {
		this.onValueChange(value);
	}

	private updateModel = (value?: T) => {
		this._deferredValueChange = value;
	}

	registerOnChange(fn: Fn<[T?], void>): void {
		this.updateModel = fn;
		if (this._deferredValueChange) {
			fn(this._deferredValueChange);
		}
	}

	@HostListener("blur")
	onTouched = () => {
		this._deferredOnTouch = true;
	}

	registerOnTouched(fn: Fn<[], void>): void {
		this.onTouched = fn;
		if (this._deferredOnTouch) {
			fn();
		}
	}

	setDisabledState(value: boolean): void {
		this.disabled = value;
	}

	// #endregion ValueAccessor impl --------------------------------------------

	// #region Overlay management -----------------------------------------------

	@HostListener("mouseenter")
	@HostListener("focus")
	initOverlay(): void {
		this._overlay.initialize({
			origin: this._elementRef,
			viewContainerRef: this._viewContainer,
			injector: this._injector,
		});
	}

	@HostListener("click")
	@HostListener("keydown.space", ["$event"])
	toggleMenu(event?: Event): void {
		event?.preventDefault();

		if (!this._menuOpen) {
			this.openMenu();
		} else {
			this.closeMenu();
		}
	}

	async openMenu() {
		this._optionList = await this._overlay.open(
			this._optionListId,
			this._optionsTemplate,
		);
		this._menuOpen = true;

		this._optionList?.close.pipe(
			take(1),
			takeUntil(merge(this._menuClose$, this._onDestroy$)),
		).subscribe(() => {
			this.closeMenu();
		});
	}

	async updateMenuPosition() {
		await firstValueFrom(this._zone.onStable);
		this._overlay.updatePosition();
	}

	closeMenu(): void {
		this._overlay.close();
		this._menuOpen = false;
		this._optionList = undefined;
		this._menuClose$.next();
	}

	// #endregion Overlay management --------------------------------------------

	// #region Model <-> View translations ---------------------------------------

	/** Invoked by our own event handlers -- updates the view and model */
	private onOptionChange(option: Option<T>) {
		if (this.value === option.value) return;

		this.value = option.value;
		this.updateView(option);
		this.updateModel(option.value);
	}

	/** Invoked by `writeValue` -- propagates model changes to the view */
	private onValueChange(value?: T): void {
		this.value = value;

		let option = this._options?.find(opt => opt.value === value);
		if (option) {
			this.updateView(option);
		}
	}

	/** Updates the UI to reflect a new selection */
	private updateView(selectedOption: Option<T>): void {
		if (!selectedOption) return;

		this.activeDescendant = selectedOption.id;
		this.updateDisplayedValue(selectedOption);
		this.updateMenuPosition();
	}

	/** Clones the option contents to the input field */
	private updateDisplayedValue(option: Option<T>): void {
		if (option.value == null) {
			this._outlet.clear();
		} else if (option.template) {
			// Surely this is a sustainable solution -- what could go wrong?
			let optionHost = option
				.template
				.elementRef
				.nativeElement
				?.parentElement as HTMLElement | undefined;

			if (!optionHost) return;

			let templateContent = [
				array(optionHost.childNodes).map(node => node.cloneNode(true))
			];

			this._outlet.clear();
			let ref = this._outlet.createComponent(SelectedValueComponent, {
				projectableNodes: templateContent,
			});

			let valueElement = ref.location.nativeElement as HTMLElement;
			valueElement.className = optionHost.className;
			valueElement.classList.remove("active");
		}
	}

	// #endregion Model <-> View translations ------------------------------------
}

@Component({
	template: `<ng-content></ng-content>`,
	encapsulation: ViewEncapsulation.None,
})
export class SelectedValueComponent {
	@HostBinding("class")
	hostClass?: string;
}
