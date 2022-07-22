import { Component } from "@angular/core";

import { Loop } from "@electric/ng-utils";
import { Fn, match } from "@electric/utils";
import { Defaults } from "../../examples.types";

@Component({
	templateUrl: "./dialog.example.html",
	styleUrls: [
		"../example.shared.scss",
		"./dialog.example.scss",
	],
})
export class DialogExample {
	showDialog = false;
	showAlert = false;
	showLoader = false;

	inputs = new InputsModel();

	heading = "Example Dialog";
	content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

	timer?: Timer;

	defaults: Defaults = {
		role: "dialog",
	};

	get controller() {
		let cmpContent =
			this.inputs.loader && !this.inputs.indeterminate ? `
				timer?: Timer;

				startTimer(): void {
					this.timer = new Timer(this.stopTimer, ${this.inputs.duration});
				}

				stopTimer = () => {
					this.timer?.cancel();
					this.timer = undefined;
				}
			` : `
				showDialog = false;
			`;

		return `
			${this.inputs.loader && !this.inputs.indeterminate ? `
			import { Loop } from "@electric/ng-utils";
			import { Fn } from "@electric/utils";
			` : ``}

			@Component({
				// ...
			})
			export class DialogExample {
				heading = "${this.heading}";
				content = "${this.content}";

				${cmpContent}
			}

			${this.inputs.loader && !this.inputs.indeterminate ? `
			class Timer {
				get total() { return this._seconds; }
				get current() { return this._current; }

				private _current = 0;
				private _cancelled = false;

				constructor (
					private onComplete: Fn,
					private _seconds: number,
				) {
					this.tick();
				}

				cancel(): void {
					this._cancelled = true;
				}

				@Loop()
				private tick(deltaTime = 0): void | false {
					if (this._cancelled)
						return false;

					this._current += deltaTime;
					if (this.current >= this.total) {
						this.onComplete();

						return false;
					}
				}
			}
			` : ``}
		`;
	}

	get template() {
		let footerContent = "";
		if (this.inputs.loader) {
			footerContent = `
				<button elx-btn icon="Cancel"
					(click)="dialog.close()"
				>
					Cancel
				</button>
			`;
		} else if (this.inputs.role === "alert") {
			footerContent = `
				<button elx-btn icon="Back"
					(click)="dialog.close()"
				>
					Back to safety
				</button>
				<button elx-btn="warning" icon="Warning"
					(click)="dialog.close()"
				>
					Danger!
				</button>
			`;
		} else {
			footerContent = `
				<button elx-btn icon="Cancel"
					(click)="dialog.close()"
				>
					Cancel
				</button>
				<button elx-btn="primary"
					icon="Confirm"
					(click)="dialog.close()"
				>
					Okay
				</button>
			`;
		}

		return `
			<button elx-btn (click)="${
				this.inputs.loader && !this.inputs.indeterminate
					? `startTimer()`
					: `showDialog = true`
			}">
				Open Dialog
			</button>

			<elx-dialog #dialog
				*elxDialogTrigger="${
					this.inputs.loader && !this.inputs.indeterminate
						? "timer"
						: "showDialog"
				}"
				role="${this.inputs.role}"
				${this.inputs.blocking ? "blocking" : ""}
				${this.inputs.loader ? "loader" : ""}
				${this.inputs.indeterminate ? `
					indeterminate
				` : this.inputs.loader ? `
				[completed]="timer?.current"
				[total]="timer?.total"
				` : ``}
				${this.inputs.loader && !this.inputs.indeterminate
					? `(close)="stopTimer()"`
					: `(close)="showDialog = false"`}
			>
				<elx-dialog-heading>
					{{ heading }}
				</elx-dialog-heading>

				<p>{{ content }}</p>
				${this.inputs.indeterminate
					? `<p>(This example won't close on its own.)</p>`
					: ``}

				<elx-dialog-footer>
					${footerContent}
				</elx-dialog-footer>
			</elx-dialog>
		`;
	}

	openDialog(): void {
		match(this.inputs.role, {
			dialog: () => {
				if (this.inputs.loader) {
					if (!this.inputs.indeterminate)
						this.startTimer();

					this.showLoader = true;
				}
				else {
					this.showDialog = true;
				}
			},
			alert: () => {
				this.showAlert = true;
			},
		});
	}

	stopTimer = () => {
		this.timer?.cancel();
		this.timer = undefined;
		this.showLoader = false;
	}

	private startTimer(): void {
		this.timer = new Timer(this.stopTimer, this.inputs.duration);
	}
}

class Timer {
	get total() { return this._seconds; }
	get current() { return this._current; }

	private _current = 0;
	private _cancelled = false;

	constructor (
		private onComplete: Fn,
		private _seconds: number,
	) {
		this.tick();
	}

	cancel(): void {
		this._cancelled = true;
	}

	@Loop()
	private tick(deltaTime = 0): void | false {
		if (this._cancelled)
			return false;

		this._current += deltaTime;
		if (this.current >= this.total) {
			this.onComplete();

			return false;
		}
	}
}

class InputsModel {
	private _role: "dialog"|"alert" = "dialog";
	get role() { return this._role; }
	set role(value) {
		this._role = value;
		if (value === "alert") {
			this.blocking = true;
			this.loader = false;
		}
	}

	private _loader = false;
	get loader() { return this._loader; }
	set loader(value) {
		this._loader = value;
		if (value) this.blocking = true;
		else this.indeterminate = false;
	}

	blocking = false;
	indeterminate = false;
	duration = 5;
}
