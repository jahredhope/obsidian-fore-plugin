import { TFile } from "obsidian";
import { basename } from "path";
import { FrontmatterChange } from "./change-frontmatter";
import { createMatcher } from "./matcher";
import { Context } from "./plugin";
import { ForePluginSettings } from "./settings";

function getAliasChanges(
  file: TFile,
  settings: ForePluginSettings,
  values: Record<string, string>,
  oldValues: Record<string, string> | null,
  override: boolean
): FrontmatterChange[] {
  const changes: FrontmatterChange[] = [];
  if (!values || !values[settings.aliasFieldName]) {
    return changes;
  }
  if (values[settings.aliasFieldName] === file.basename) {
    // Avoid setting alias to the same as the file name
    return changes;
  }

  let oldValue: string | undefined = undefined;
  if (
    oldValues &&
    oldValues[settings.aliasFieldName] &&
    oldValues[settings.aliasFieldName] !== values[settings.aliasFieldName]
  ) {
    oldValue = oldValues[settings.aliasFieldName];
  }

  changes.push({
    action:
      settings.autoAliasEvenWhenExisting || override
        ? "alias-set"
        : "alias-add",
    value: values[settings.aliasFieldName],
    oldValue,
  });
  return changes;
}

function getCustomPropertyChanges(
  settings: ForePluginSettings,
  values: Record<string, string>,
  oldValues: Record<string, string> | null,
  override: boolean
): FrontmatterChange[] {
  const changes: FrontmatterChange[] = [];
  for (const prop of settings.autoCustomProperties) {
    if (!prop.auto && !override) continue;
    if (values[prop.field]) {
      changes.push({
        action: prop.override || override ? "property-set" : "property-add",
        field: prop.field,
        value: values[prop.field],
        oldValue: oldValues?.[prop.field],
      });
    }
  }
  return changes;
}

export function changesFromFilename(
  file: TFile,
  { override, oldPath }: { override: boolean; oldPath?: string },
  context: Context
): FrontmatterChange[] {
  const { settings } = context;
  if (!settings.autoAliasPathMatch) return [];

  const getValuesFromName = createMatcher(settings.autoAliasPathMatch);
  const values = getValuesFromName(file.basename);
  const oldValues = (oldPath && getValuesFromName(basename(oldPath))) || null;

  if (!values) return [];

  const changes = [];
  changes.push(...getAliasChanges(file, settings, values, oldValues, override));
  changes.push(
    ...getCustomPropertyChanges(settings, values, oldValues, override)
  );

  return changes;
}
