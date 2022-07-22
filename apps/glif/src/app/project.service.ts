import { Injectable, OnDestroy } from "@angular/core";
import { Option } from "@electric/utils";
import * as dialog from "@tauri-apps/api/dialog";
import { map, BehaviorSubject } from "rxjs";

export type Path = string;

@Injectable({
	providedIn: "root",
})
export class ProjectService implements OnDestroy {
	private _home$ = new BehaviorSubject<Path | null>(null);

	get home$() { return this._home$.asObservable(); }
	get home() { return this._home$.value; }

	get name$() { return this._home$.pipe(map(basename)); }
	get name() { return basename(this.home); }

	ngOnDestroy(): void {
		this._home$.complete();
	}

	async create(): Promise<Path | null> {
		try {
			const result = await dialog.open({
				title: "Choose or Create Project Directory",
				directory: true,
				multiple: false,
			}) as Path | null;

			if (!result) return null;

			this._home$.next(result);
			console.log(`Created project at "${result}"`);
			return result;
		}
		catch (err) {
			console.error(err);
			return null;
		}
	}

	async open(): Promise<Path | null> {
		return this.create(); // TODO
	}
}

function basename(path?: Option<Path>): string | null {
	return path?.split(/[\\\/]/g).pop() ?? null;
}
