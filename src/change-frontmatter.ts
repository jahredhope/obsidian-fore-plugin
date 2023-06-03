import { parseFrontMatterAliases, TFile } from "obsidian";
import {
  formatToTagName,
  getUsedKey,
  parseFrontMatterTagsRaw,
} from "./frontmatter-utils";
import { ForePluginSettings } from "./settings";

export type FrontmatterChange =
  | { action: "sort" }
  | { action: "alias-add"; value: string; oldValue?: string }
  | { action: "alias-set"; value: string; oldValue?: string }
  | { action: "alias-remove"; value: string }
  | { action: "alias-replace"; value: string; oldValue: string }
  | { action: "tag-add"; value: string; oldValue?: string }
  | { action: "tag-set"; value: string }
  | { action: "tag-remove"; value: string }
  | { action: "tag-replace"; value: string; oldValue: string }
  | { action: "property-add"; field: string; value: unknown; oldValue?: string }
  | { action: "property-set"; field: string; value: unknown }
  | { action: "property-remove"; field: string; value: unknown }
  | {
      action: "property-replace";
      field: string;
      value: unknown;
      oldValue: unknown;
    };

export function changeFrontmatter(
  file: TFile,
  changes: FrontmatterChange[],
  context: { settings: ForePluginSettings }
) {
  if (changes.length === 0) return;
  console.log("Change Frontmatter", file.basename, ...changes);
  app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      let sortAfter = context.settings.sortOnChange;

      const aliases = parseFrontMatterAliases(frontmatter) || [];
      const tags = parseFrontMatterTagsRaw(frontmatter);

      for (const change of changes) {
        if (change.action === "sort") {
          sortAfter = true;
        }
        if (
          change.action === "property-set" ||
          (change.action === "property-add" &&
            (!frontmatter[change.field] ||
              frontmatter[change.field] === change.oldValue)) ||
          (change.action === "property-replace" &&
            frontmatter[change.field] &&
            frontmatter[change.field] === change.oldValue)
        ) {
          frontmatter[change.field] = change.value;
        }
        if (change.action === "property-remove" && frontmatter[change.field]) {
          delete frontmatter[change.field];
        }

        if (change.action === "tag-add" && change.value) {
          tags.push(change.value);
        }
        if (change.action === "tag-replace" && tags.includes(change.oldValue)) {
          const index = tags.indexOf(change.oldValue);
          if (index >= 0) {
            tags.splice(index, 1, formatToTagName(change.value));
          }
        }
        if (change.action === "tag-remove" && tags.includes(change.value)) {
          const index = tags.indexOf(change.value);
          if (index >= 0) {
            tags.splice(index, 1);
          }
        }
        if (change.action === "alias-set" && change.value) {
          aliases.push(change.value);
        }
        if (
          change.action === "alias-add" &&
          (aliases.length === 0 ||
            (change.oldValue && aliases.includes(change.oldValue)))
        ) {
          if (change.oldValue) {
            const index = aliases.indexOf(change.oldValue);
            if (index >= 0) {
              aliases.splice(index, 1, change.value);
            } else {
              aliases.push(change.value);
            }
          } else {
            aliases.push(change.value);
          }
        }
        if (
          change.action === "alias-replace" &&
          aliases.includes(change.oldValue)
        ) {
          const index = aliases.indexOf(change.oldValue);
          if (index >= 0) {
            aliases.splice(index, 1, formatToTagName(change.value));
          }
        }
        if (
          change.action === "alias-remove" &&
          aliases.includes(change.value)
        ) {
          const index = aliases.indexOf(change.value);
          if (index >= 0) {
            aliases.splice(index, 1);
          }
        }
      }

      const aliasField = getUsedKey(frontmatter, ["alias", "aliases"]);
      const formatAliasAsCommaSeparated = !Array.isArray(
        frontmatter[aliasField]
      );
      if (aliases.length === 0) {
        delete frontmatter[aliasField];
      } else {
        frontmatter[aliasField] = formatAliasAsCommaSeparated
          ? aliases.join(", ")
          : aliases;
      }

      const tagField = getUsedKey(frontmatter, ["tag", "tags"]);
      const formatTagsAsCommaSeparated = !Array.isArray(frontmatter[tagField]);
      if (tags.length === 0) {
        delete frontmatter[tagField];
      } else {
        frontmatter[tagField] = formatTagsAsCommaSeparated
          ? tags.join(", ")
          : tags;
      }

      if (sortAfter) {
        const clone = { ...frontmatter };
        const keys = Object.keys(clone).sort();
        for (const key of keys) {
          delete frontmatter[key];
        }
        for (const key of keys) {
          frontmatter[key] = clone[key];
        }
      }
    }
  );
}
