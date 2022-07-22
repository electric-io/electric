export type Obj = { [key: string]: any };
export type Predicate<T> = (value: T) => boolean;
export type Nullish = undefined | null | void;
export type Option<T> = Nullish | T;
export type Transparent<T> = {} & { [K in keyof T]: T[K]; };

export interface Fn<Args extends any[] = [], R = void> {
	(...args: Args): R;
}

export interface AsyncFn<Args extends any[] = [], R = void> {
	(...args: Args): Promise<R>;
}
