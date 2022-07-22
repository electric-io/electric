import { Fn } from "./types";

type Key = string | number;

type ExhaustiveMatcher<Union extends Key>
	= Record<Union, () => any>

type MatcherWithFallback<Union extends Key>
	= Partial<Record<Union, () => any>>
	& { _: () => any }

type Matcher<Union extends Key>
	= ExhaustiveMatcher<Union>
	| MatcherWithFallback<Union>

export function match<K extends Key, T extends Matcher<K>>(
	subject: K,
	matcher: T,
): T[K] extends Fn<[], infer R> ? R
	: Extract<T, MatcherWithFallback<K>>["_"] extends Fn<[], infer R> ? R
	: never
{
	if (subject in matcher)
		return matcher[subject]!();

	if ("_" in matcher)
		return matcher._();

	throw new Error(`No match found for subject \`${subject}\` in matcher`);
}
