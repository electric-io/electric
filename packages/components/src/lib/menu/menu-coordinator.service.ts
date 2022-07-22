import { FocusKeyManager } from "@angular/cdk/a11y";
import { Injectable, QueryList } from "@angular/core";
import {
	filter,
	fromEvent,
	map,
	merge,
	Observable,
	shareReplay,
	startWith,
	Subject,
	Subscription,
	switchMap,
	take,
	takeUntil,
	tap,
	timer,
	withLatestFrom,
} from "rxjs";

import {
	assert,
	elementId,
	ElementId,
	entries,
	exists,
	fromKeydown,
	match,
} from "@electric/utils";

import { MenuOverlayManager } from "./menu-overlay.service";
import {
	Menu,
	MenuCloseEvent,
	MenuEvent,
	MenuItem,
	MenuKind,
	MenuOpenEvent,
	MenuTrigger,
} from "./menu.types";

const NOOP = () => {};

/**
 * A registry for all menus in the app. Manages parent/child relationships
 * between menus and submenus, and ensures that only one menu is ever open at a
 * time.
 */
@Injectable({
	providedIn: "root",
})
export class MenuCoordinator {
	// ID -> Menu lookups
	// Entries need to be deleted when unregistered to avoid memory leaks
	private _menus = new Map<ElementId, AbstractMenuController>();
	private _topLevelMenus = new Map<ElementId, AbstractMenuController>();

	// Trigger/Menu -> ID lookups
	// These need to be WeakMaps to avoid memory leaks
	private _menuTriggerIdLookup = new WeakMap<MenuTrigger, ElementId>();
	private _menuComponentIdLookup = new WeakMap<Menu, ElementId>();

	// This subscription closes all other menus
	// whenever a new top-level menu is opened
	private _subscription?: Subscription;

	register(
		kind: MenuKind,
		trigger: MenuTrigger,
		overlay: MenuOverlayManager,
		parent?: Menu,
	): void {
		// The setup here only needs to be done once per trigger
		if (this._menuTriggerIdLookup.has(trigger)) return;

		// Sanity check
		if (kind === MenuKind.Submenu) {
			assert(parent != null, "Submenu registered without a parent");
		}

		// Assign a new ID for this Trigger/Menu pair
		let id = elementId();
		this._menuTriggerIdLookup.set(trigger, id);
		this._menuComponentIdLookup.set(trigger.menu, id);

		// Instantiate the appropriate menu controller for this menu
		// and add it to the map
		let menu = match(kind, {
			[MenuKind.Menu]:    () => new MenuController(id, trigger, overlay),
			[MenuKind.Context]: () => new ContextMenuController(id, trigger, overlay),
			[MenuKind.Submenu]: () => new SubmenuController(id, trigger, overlay),
		});

		this._menus.set(id, menu);

		if (parent) {
			// Connect the parent to its child and vice versa
			if (this._menuComponentIdLookup.has(parent)) {
				let parentId = this._menuComponentIdLookup.get(parent)!;
				if (this._menus.has(parentId)) {
					let parentMenu = this._menus.get(parentId)!;

					parentMenu.registerChild(menu);
					menu.registerParent(parentMenu);
				}
			}
		} else {
			this._topLevelMenus.set(id, menu);
			this.updateSubscription();
		}
	}

	unregister(trigger: MenuTrigger): void {
		let id: ElementId | undefined;
		if ((id = this._menuTriggerIdLookup.get(trigger))) {
			this._menus.get(id)?.destroy();
			this._menus.delete(id);
			this._topLevelMenus.delete(id);
			this.updateSubscription();
		}
	}

	private updateSubscription(): void {
		this._subscription?.unsubscribe();

		let menus = entries(this._topLevelMenus);
		let topLevelMenuOpened$ = merge(...menus.map(([, menu]) => menu.opened$));

		this._subscription = topLevelMenuOpened$.subscribe(openedId => {
			for (let [id, menu] of menus) {
				if (id !== openedId) {
					menu.close();
				}
			}
		});
	}
}

/**
 * This class and its derivatives serve as unified controllers that coordinate
 * behavior between the various UI classes that make up a single menu (the
 * trigger directive, the menu component, the menu items, and the directive-
 * scoped overlay manager service) and the root-level menu coordinator service.
 *
 * The controller's primary responsibility is defining and handling each menu's
 * open/close events in an accessible way, without sacrificing the ergonomics
 * and composability of having separate Angular entities for each piece of the
 * whole.
 *
 * This particular class is the pseudo-abstract base class from which all of the
 * concrete implementations derive -- it defines only the generic behavior which
 * is shared between all variants.
 */
class AbstractMenuController {
	readonly id: ElementId;

	protected overlay: MenuOverlayManager;
	protected trigger: MenuTrigger;
	protected get triggerElement() { return this.trigger.elementRef.nativeElement }
	protected get template() { return this.trigger.menu.template }

	protected items: QueryList<MenuItem>;
	protected items$: Observable<QueryList<MenuItem>>;
	protected keydown$: Observable<KeyboardEvent>;
	protected keyManager: FocusKeyManager<MenuItem>;

	protected parent?: AbstractMenuController;
	protected children: AbstractMenuController[] = [];

	opened$: Observable<ElementId>;
	protected isOpen$: Observable<boolean>;
	protected _opened$: Observable<MenuOpenEvent>;
	protected _closed$: Observable<MenuCloseEvent>;

	// Virtual
	protected get openEvents$(): Observable<Event> {
		throw new Error(`\`openEvents$\` not implemented for class: ${this}`);
	}
	protected get closeEvents$(): Observable<void> {
		return this._opened$.pipe(
			withLatestFrom(this.items$),
			switchMap(([{ menuPanel }, items]) => {
				return merge(
					// Tabbing out of the menu
					fromKeydown(menuPanel.elementRef, "Tab"),
					// Pressing Esc (which should re-focus the trigger)
					fromKeydown(menuPanel.elementRef, "Escape").pipe(
						tap(() => this.triggerElement.focus({ preventScroll: true })),
					),
					// Clicking anywhere but inside the menu or on the trigger
					fromEvent(document, "click").pipe(
						filter(event => {
							let path = event.composedPath();
							return !path.includes(menuPanel.elementRef.nativeElement)
								&& !path.includes(this.triggerElement);
						}),
					),
					// Pressing one of our menu items
					merge(...items
						.filter(item => !item.hasSubmenu)
						.map(item => item.pressed$)
					),
				).pipe(
					take(1),
					takeUntil(this.onDestroy$),
				);
			}),
			map(NOOP),
			takeUntil(this.onDestroy$),
		);
	}

	protected onDestroy$ = new Subject<void>();

	constructor(
		id: ElementId,
		trigger: MenuTrigger,
		overlay: MenuOverlayManager,
	) {
		this.id = id;
		this.trigger = trigger;
		this.overlay = overlay;
		this.items = trigger.menu.items;

		this.keyManager = new FocusKeyManager(this.items)
			.withVerticalOrientation()
			.withWrap();

		this.isOpen$ = this.overlay.events$.pipe(
			startWith({ isOpen: false }),
			map(event => event.isOpen),
			shareReplay({ refCount: true }),
			takeUntil(this.onDestroy$),
		);
		this._opened$ = overlay.events$.pipe(
			filter(isOpenEvent),
			takeUntil(this.onDestroy$),
		);
		this._closed$ = overlay.events$.pipe(
			filter(isCloseEvent),
			takeUntil(this.onDestroy$),
		);
		this.opened$ = this._opened$.pipe(
			map(() => this.id),
			takeUntil(this.onDestroy$),
		);
		this.items$ = this.items.changes.pipe(
			startWith(this.items),
			takeUntil(this.onDestroy$),
		);
		this.keydown$ = this._opened$.pipe(
			switchMap(({ menuPanel }) => fromKeydown(menuPanel.elementRef)),
			takeUntil(this.onDestroy$),
		);

		this.onInit();
	}

	registerParent(menu: AbstractMenuController): void {
		this.parent = menu;

		// Close this menu when another of our parent's menu items is hovered
		this._opened$.pipe(
			withLatestFrom(this.parent.items$),
			switchMap(([, items]) => merge(...items.map((item) => item.hovered$))),
			filter(element => element !== this.triggerElement),
			takeUntil(this.onDestroy$),
		).subscribe(() => this.close());
	}

	registerChild(menu: AbstractMenuController): void {
		this.children.push(menu);
	}

	close(): void {
		this.children.forEach(child => child.close());
		this.overlay.close();
	}

	destroy(): void {
		this.onDestroy$.next();
		this.onDestroy$.complete();
	}

	protected onInit(): void {
		this.closeEvents$.subscribe(() => this.close());
		this.isOpen$.subscribe(this.setAriaExpanded);
		this._opened$.subscribe(this.onOpen);

		this.keydown$
			.pipe(filter(event => /^Arrow(Down|Up)$/.test(event.key)))
			.subscribe(event => {
				this.keyManager.setFocusOrigin("keyboard");
				this.keyManager.onKeydown(event);
			});
	}

	protected setAriaExpanded = (isOpen: boolean) => {
		if (isOpen) {
			this.triggerElement.setAttribute("aria-expanded", "true");
		} else {
			this.triggerElement.removeAttribute("aria-expanded");
		}
	}

	protected onOpen = ({
		originalEvent: event,
		focusOrigin
	}: MenuOpenEvent) => {
		this.keyManager.setFocusOrigin(focusOrigin);

		if (event instanceof KeyboardEvent && event.key === "ArrowUp") {
			this.keyManager.setLastItemActive();
		} else {
			this.keyManager.setFirstItemActive();
		}
	}
}

/**
 * This class represents an ordinary menu which is opened by pressing a trigger
 * button.
 */
class MenuController extends AbstractMenuController {
	protected override get openEvents$() {
		let click$ = fromEvent(this.triggerElement, "click");
		let arrowupdown$ = fromKeydown(this.triggerElement, /^Arrow(Up|Down)$/);

		return merge(click$, arrowupdown$).pipe(takeUntil(this.onDestroy$));
	}

	protected override get closeEvents$() {
		return merge(
			super.closeEvents$,
			// Clicking the trigger element while the menu is open
			this._opened$.pipe(
				switchMap(() => fromEvent(this.triggerElement, "click").pipe(
					map(NOOP),
					take(1),
					takeUntil(this._closed$),
					takeUntil(this.onDestroy$),
				)),
			),
		).pipe(
			takeUntil(this.onDestroy$),
		);
	}

	protected override onInit(): void {
		this.openEvents$.subscribe(event => this.open(event));
		super.onInit();
	}

	open(event: Event): void {
		this.overlay.open(this.template!, event);
	}
}

/**
 * This class represents a context menu, opened by right-clicking (or pressing
 * the "menu" key) within a defined area.
 */
class ContextMenuController extends AbstractMenuController {
	protected override get openEvents$(): Observable<Event> {
		return fromEvent(this.triggerElement, "contextmenu")
			.pipe(takeUntil(this.onDestroy$));
	}

	protected override onInit(): void {
		super.onInit();
		this.openEvents$.subscribe(event => this.open(event as MouseEvent));
	}

	open(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();

		let { x, y } = event;
		this.overlay.initialize({
			origin: { x, y },
			menuPanelClass: this.trigger.menu.panelClass,
			encapsulationId: this.trigger.menu.encapsulationId,
		});

		setTimeout(() => this.overlay.open(this.template!, event));
	}
}

/**
 * This class represents a submenu, which is opened by hovering or pressing a
 * menu item within its parent menu.
 */
class SubmenuController extends AbstractMenuController {
	protected override get openEvents$() {
		let hover$ = fromEvent(this.triggerElement, "mouseenter").pipe(
			startWith(((): MouseEvent|void => {
				// Since the submenu trigger doesn't register itself until the first
				// time it's moused over or focused, we'll likely already be
				// hovering by the time this class is constructed.

				// To catch that first hover, we check whether it's already being
				// hovered in a `startWith` IIFE and immediately emit a synthetic
				// 'mouseenter' event.

				// The X and Y coordinates need to be non-zero to avoid the Overlay
				// Manager calling our bullshit and setting the focus origin to
				// "keyboard".
				if (this.triggerElement.matches(":hover")) {
					let event = new MouseEvent("mouseenter", {
						clientX: 42,
						clientY: 42,
					});

					return event;
				}
			})()),
			filter(exists),
			// Submenu should open on hover after a brief delay
			switchMap(event => timer(250).pipe(
				map(() => event),
				take(1),
				takeUntil(fromEvent(this.triggerElement, "mouseleave")),
			)),
		);

		let click$ = fromEvent(this.triggerElement, "click");
		let keyRight$ = fromKeydown(this.triggerElement, "ArrowRight")
			.pipe(tap(event => event.stopPropagation()));

		return merge(hover$, click$, keyRight$)
			.pipe(takeUntil(this.onDestroy$));
	}

	protected override get closeEvents$() {
		let super$ = super.closeEvents$;
		let arrowLeft$ = this._opened$.pipe(
			switchMap(({ menuPanel }) => fromKeydown(
				menuPanel.elementRef,
				"ArrowLeft"
			).pipe(
				take(1),
				takeUntil(this.onDestroy$),
			)),
			takeUntil(this.onDestroy$),
			tap(event => {
				event.stopPropagation();
				this.triggerElement.focus({ preventScroll: true });
			}),
			map(NOOP),
		);

		return merge(super$, arrowLeft$);
	}

	protected override onInit(): void {
		super.onInit();
		this.openEvents$.subscribe(event => this.open(event));
	}

	open(event: Event): void {
		this.overlay.open(this.template!, event);
	}
}

function isOpenEvent(event: MenuEvent): event is MenuOpenEvent {
	return event.isOpen;
}

function isCloseEvent(event: MenuEvent): event is MenuCloseEvent {
	return !event.isOpen;
}
