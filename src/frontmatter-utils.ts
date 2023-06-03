/**
 * Formats a string to only contain valid characters for an [Obsidian Tag](https://help.obsidian.md/Editing+and+formatting/Tags#Tag+format).
 *
 * Valid Tags include:
 *  - Alphabetical letters
 *  - Numbers
 *  - Underscore (_)
 *  - Hyphen (-)
 *  - Forward slash (/) for Nested tags
 */
export function formatToTagName(str: string) {
  return str.replace(/[^A-z0-9_\-\\/]/g, "-");
}

/**
 * Identifies which of the keys was used in the object.
 *
 * Useful when a key has multiple aliases.
 */
export function getUsedKey<T extends string>(
  obj: Record<string, unknown>,
  keys: T[]
): T {
  return (Object.keys(obj).find((k: T) => keys.includes(k)) || keys[0]) as T;
}

/**
 * parseFrontMatterTagsRaw
 *
 * Parses frontmatter for existing tags
 *
 * *Note: Obsidian's default parseFrontMatterTags adds the # prefix to tags*
 * @return string[] Without the # prefix
 */
export function parseFrontMatterTagsRaw(
  frontmatter: Record<string, unknown>
): string[] {
  const key = getUsedKey(frontmatter, ["tag", "tags"]);
  const value = frontmatter[key];
  if (!value) return [];
  if (typeof value === "string") return value.split(",").map((v) => v.trim());
  if (Array.isArray(value)) return value as string[];
  console.error({ value, key });
  throw new Error(`Unable to parse existing tags. ${value}`);
}
