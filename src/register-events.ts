import { TFile } from "obsidian";
import { onFileMenu } from "./file-menu";
import { ForePlugin } from "./plugin";

export function registerEvents(this: ForePlugin) {
  this.registerEvent(
    this.app.workspace.on("file-menu", (menu, abstract) => {
      onFileMenu(menu, abstract, { app: this.app, plugin: this });
    })
  );

  const checkForUpdateAlias = (file: TFile, oldPath?: string) => {
    if (this.settings.aliasFromNameOnRename)
      this.fire({ type: "auto-update", override: false, oldPath }, file);
  };

  // Disable updating on create event for now.
  // It doesn't only run on newly created documents, it also runs for all documents on application start.
  // this.registerEvent(this.app.vault.on("create", checkForUpdateAlias));

  this.registerEvent(this.app.vault.on("rename", checkForUpdateAlias));
}
