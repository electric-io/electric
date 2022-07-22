import { assertType } from "./assert";
import { keys } from "./object";
import { Fn, Predicate } from "./types";

type Collection<T> = T extends Element ? HTMLCollectionOf<T>
	: Iterable<T> | ArrayLike<T>;

export function array<T extends Element>(collection: HTMLCollectionOf<T>): T[];
export function array<T>(collection: Iterable<T> | ArrayLike<T>): T[];
export function array<T>(collection: Collection<T>): T[] {
	if (collection instanceof Array) {
		return collection;
	}
	return Array.from(collection);
}

export function last<T>(array: T[]): T {
	return array[array.length - 1];
}

export function partition<T>(predicate: Predicate<T>) {
	return (collection: Iterable<T>): [T[], T[]] => {
		let subsetA: T[] = [];
		let subsetB: T[] = [];

		for (let item of collection) {
			if (predicate(item)) {
				subsetA.push(item);
			} else {
				subsetB.push(item);
			}
		}

		return [subsetA, subsetB];
	};
}

export function sort<T>(compare: Fn<[T, T], number>) {
	return (collection: Iterable<T>): T[] => {
		let arr = collection instanceof Array
			? collection.slice()
			: Array.from(collection);

		return arr.sort(compare);
	};
}

type KeyOf<T> = T extends Record<infer K, any> ? (K & string & keyof T)
	: string & keyof T;

export function keyBy<T>(key: KeyOf<T>) {
	return (collection: Iterable<T>): { [key: string]: Omit<T, KeyOf<T>> } => {
		return array(collection)
			.reduce((accum, current) => {
				let currentKey = current[key] ?? "";
				let currentValue = {} as any;

				for (let k of keys(current)) {
					if (k !== key) currentValue[k] = current[k];
				}

				assertType<string>(currentKey);

				return { ...accum, [currentKey]: currentValue };
			}, {});
	};
}

export function map<T, R>(transform: Fn<[T, number?], R>) {
	return (collection: Iterable<T>): R[] => array(collection).map(transform);
}

export function filter<T, R extends T>(
	predicate: (it: T, idx?: number) => it is R,
): (collection: Iterable<T>) => R[];
export function filter<T>(
	predicate: Fn<[T, number?], any>,
): (collection: Iterable<T>) => T[];

export function filter(predicate: any) {
	return (collection: any) => array(collection).filter(predicate);
}

export function replaceAt<T>(index: number, newItem: T) {
	return (array: T[]) => array.map((item, i) => i === index ? newItem : item);
}

export function removeAt<T>(index: number) {
	return (array: T[]) => array.filter((_, i) => i !== index);
}
