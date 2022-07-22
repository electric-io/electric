import { coerceElement } from "@angular/cdk/coercion";
import { ElementRef } from "@angular/core";
import { match } from "@electric/utils";

export enum EncapsulationKind {
	Content = "_ngcontent-",
	Host = "_nghost-",
}

const CONTENT_PATTERN = /^_ngcontent-(.+)/;
const HOST_PATTERN = /^_nghost-(.+)/;

export function findEncapsulationId(
	element: ElementRef | Element,
	kind?: EncapsulationKind,
): string | undefined {
	let { attributes } = coerceElement(element);
	if (kind) return impl(attributes, kind);

	return impl(attributes, EncapsulationKind.Host)
		|| impl(attributes, EncapsulationKind.Content);
}

function impl(attributes: NamedNodeMap, prefix: EncapsulationKind) {
	let pattern = match(prefix, {
		[EncapsulationKind.Content]: () => CONTENT_PATTERN,
		[EncapsulationKind.Host]: () => HOST_PATTERN,
	});

	for (let i = 0; i < attributes.length; ++i) {
		let attr = attributes[i];
		if (attr.name.startsWith(prefix)) {
			return attr.name.match(pattern)![1]!;
		}
	}

	return undefined;
}
