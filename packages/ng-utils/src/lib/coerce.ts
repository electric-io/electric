import { coerceBooleanProperty, coerceNumberProperty } from "@angular/cdk/coercion";

import { match } from "@electric/utils";

type Coerced<Ctor> = Ctor extends (...args: any[]) => infer R ? R : never;

declare global {
	interface NumberConstructor {
		readonly name: "Number";
	}
	interface BooleanConstructor {
		readonly name: "Boolean";
	}
}

export function Coerce(
	typeHint: typeof Number | typeof Boolean
): PropertyDecorator {
	return (proto, propName) => {
		let symbol = Symbol(propName.toString());
		let coerce = match(typeHint.name, {
			Number: () => (value: any) => {
				if (value == null) return null;
				return coerceNumberProperty(value);
			},
			Boolean: () => coerceBooleanProperty,
		});

		Object.defineProperty(proto, propName, {
			get(): Coerced<typeof typeHint> {
				return this[symbol];
			},
			set(value: any) {
				this[symbol] = coerce(value);
			},
			enumerable: true,
			configurable: true,
		});
	};
}
