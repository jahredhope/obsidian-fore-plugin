export function formatAsTag(str: string) {
	return str.replace(/[^A-z0-9_\-\\/]/, "_");
}
