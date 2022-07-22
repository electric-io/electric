import {
	Component,
	ChangeDetectionStrategy,
	Input,
	HostBinding,
	Inject,
	OnInit,
	OnDestroy,
	ViewEncapsulation,
	Output,
	EventEmitter,
} from "@angular/core";
import { Subject } from "rxjs";

import { Coerce } from "@electric/ng-utils";
import { elementId, match } from "@electric/utils";

import {
	GRAPH_VIEW_MODEL,
	GRAPH,
	Graph,
	GraphNode,
	GraphViewModel,
	NodeAlignment,
	Point,
	Port,
} from "../graph.types";
import { PortConnectionEvent } from "..";

@Component({
	template: ``,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseNode
implements OnInit, OnDestroy, GraphNode {
	@HostBinding("class")
	protected readonly hostClass: string = "";

	@HostBinding("style.position")
	readonly _position = "absolute";

	@HostBinding("style.left.px")
	get _offsetX() { return this.x * this.vm.cellSize; }

	@HostBinding("style.top.px")
	get _offsetY() { return this.y * this.vm.cellSize; }

	@HostBinding("style.transform")
	get _transform() {
		return `
			translateX(${this._translateX})
			translateY(${this._translateY})`;
	}
	private get _translateX() {
		return match(this.xAlign, {
			left:   () => "0",
			center: () => "-50%",
			right:  () => "-100%",
			_:      () => "0",
		});
	}
	private get _translateY() {
		return match(this.yAlign, {
			top:    () => "0",
			center: () => "-50%",
			bottom: () => "-100%",
			_:      () => "0",
		});
	}

	@Input() id = elementId("graph-node");

	@Input() @Coerce(Number) x = 0;
	@Input() @Coerce(Number) y = 0;

	@Input() inputs: Port[] = [];
	@Input() outputs: Port[] = [];

	@Output() connected = new EventEmitter<PortConnectionEvent>();

	@Input("xAlign")
	get xAlignInput() { return this.xAlign; }
	set xAlignInput(value) {
		switch (value) {
			case "left":
			case "center":
			case "right":
				this.xAlign = value;
				break;
			default:
				throw new Error(
					`Value ${value} is not assignable to input \`xAlign\``
				);
		}
	}
	protected xAlign: NodeAlignment = "left";

	@Input()
	get yAlignInput() { return this.yAlign; }
	set yAlignInput(value) {
		switch (value) {
			case "top":
			case "center":
			case "bottom":
				this.yAlign = value;
				break;
			default:
				throw new Error(
					`Value ${value} is not assignable to input \`yAlign\``
				);
		}
	}
	protected yAlign: NodeAlignment = "top";

	changes$ = new Subject<void>();
	protected onDestroy$ = new Subject<void>();

	constructor (
		@Inject(GRAPH) protected graph: Graph,
		@Inject(GRAPH_VIEW_MODEL) public vm: GraphViewModel,
	) {}

	ngOnInit(): void {
		this.graph.registerNode(this);
	}

	ngOnDestroy(): void {
		this.onDestroy$.next();
		this.onDestroy$.complete();

		this.graph.unregisterNode(this);
		this.changes$.complete();
	}

	inputOffset(_: number): Point {
		return { x: 0, y: 0 };
	}

	outputOffset(_: number): Point {
		return { x: 0, y: 0 };
	}
}
