import { App, Menu, TAbstractFile } from "obsidian";
import { walk } from "./walk-files";
import { ForePlugin } from "./plugin";

export function onFileMenu(
  menu: Menu,
  abstract: TAbstractFile,
  { app, plugin }: { app: App; plugin: ForePlugin }
) {
  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("Fore: Change Tag")
      .setIcon("document")
      .onClick(async () => {
        plugin.showChangeTagModal(abstract);
      });
  });

  if (plugin.settings.enableAliasFromName) {
    menu.addItem((item) => {
      item
        .setTitle("Fore: Auto Update")
        .setIcon("document")
        .onClick(async () => {
          for (const file of walk(abstract)) {
            plugin.fire({ type: "auto-update", override: false }, file);
          }
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Fore: Force Auto Update")
        .setIcon("document")
        .onClick(async () => {
          for (const file of walk(abstract)) {
            plugin.fire({ type: "auto-update", override: true }, file);
          }
        });
    });
  }
  menu.addSeparator();
}
