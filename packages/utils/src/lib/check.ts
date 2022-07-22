import { Nullish, Option } from "./types";

export function exists<T>(value?: Option<T>): value is NonNullable<T> {
	return value != null;
}

type Truthy<T> = Exclude<T, "" | 0 | false | Nullish>;

export function isTruthy<T>(value?: T): value is Truthy<T> {
	return Boolean(value);
}
