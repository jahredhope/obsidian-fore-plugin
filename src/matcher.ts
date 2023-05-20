import { Key, pathToRegexp } from "path-to-regexp";

export function createMatcher<ParamInPath extends string>(path: string) {
	const keys: Key[] = [];
	const regex = pathToRegexp(path, keys);
	return function getValues(
		name: string
	): Record<ParamInPath, string> | null {
		const match = regex.exec(name);
		if (!match) return null;

		return Object.fromEntries(
			keys.map((key, index) => [key.name, match[index + 1]])
		) as Record<ParamInPath, string>;
	};
}
