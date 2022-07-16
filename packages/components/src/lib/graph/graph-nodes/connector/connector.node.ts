import { DOCUMENT } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Inject,
	Input,
	OnInit,
	Output,
	ViewEncapsulation,
} from "@angular/core";
import { animationFrames, fromEvent, merge, takeUntil, tap } from "rxjs";

import { GraphLibrary } from "../../graph-library.service";
import {
	Graph,
	GRAPH,
	GraphViewModel,
	GRAPH_VIEW_MODEL,
	NodeAlignment,
} from "../../graph.types";
import { BaseNode } from "../base.node";

@Component({
	selector: "elx-connector-node",
	template: `

<div class="elx-connector-node__shape"
	[style.background-color]="color"
></div>

	`,
	styleUrls: ["./connector.node.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorNode extends BaseNode implements OnInit {
	protected override readonly hostClass = "elx-connector-node";

	protected override xAlign: NodeAlignment = "center";
	protected override yAlign: NodeAlignment = "center";

	@Input() type!: string;
	@Output() dropped = new EventEmitter<void>();

	get color() { return this._color ??= this._library.typeColor(this.type); }
	private _color?: string;

	constructor (
		@Inject(GRAPH) graph: Graph,
		@Inject(GRAPH_VIEW_MODEL) vm: GraphViewModel,
		@Inject(DOCUMENT) private _document: Document,
		private _library: GraphLibrary,
	) {
		super(graph, vm);
	}

	override ngOnInit(): void {
		super.ngOnInit();

		animationFrames().pipe(
			takeUntil(merge(
				fromEvent(this._document, "pointerup").pipe(
					tap(() => {
						this.dropped.emit();
					}),
				),
				this.onDestroy$,
			)),
		).subscribe(_ => {
			let { cursor, offset, scale, cellSize } = this.vm;

			let x = Math.round((cursor.x - offset.x) / scale / cellSize);
			let y = Math.round((cursor.y - offset.y) / scale / cellSize);

			if (x !== this.x || y !== this.y) {
				this.x = x;
				this.y = y;
				this.changes$.next();
			}
		});
	}
}
