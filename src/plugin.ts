import { App, Plugin, TAbstractFile, TFile } from "obsidian";
import {
  AutoFrontmatterSettingTab,
  DEFAULT_SETTINGS,
  ForePluginSettings,
} from "src/settings";
import { changeFrontmatter } from "./change-frontmatter";
import { registerCommands } from "./register-commands";
import { changesFromFilename } from "./automatic-values";
import { logger } from "./logger";
import { registerEvents } from "./register-events";
import { UpdateTagModal } from "./update-tag-modal";
import { walk } from "./walk-files";

export interface Context {
  app: App;
  dispatch: (event: ChangeEvent) => void;
  settings: ForePluginSettings;
}

export type ChangeEvent =
  | {
      type: "sort";
    }
  | {
      type: "add-tag";
      value: string;
    }
  | {
      type: "remove-tag";
      value: string;
    }
  | {
      type: "replace-tag";
      value: string;
      oldValue: string;
    }
  | { type: "set-alias"; value: string; override: boolean }
  | { type: "force-auto-update"; override: boolean }
  | { type: "auto-update"; override: boolean; oldPath?: string };

export class ForePlugin extends Plugin {
  settings: ForePluginSettings;

  public async onload() {
    await this.loadSettings();

    this.addSettingTab(new AutoFrontmatterSettingTab(this.app, this));

    this.registerEvents();
    this.registerCommands();
  }

  public onunload() {}

  private getContext(): Context {
    return {
      app: this.app,
      settings: this.settings,
      dispatch: this.fire.bind(this),
    };
  }
  private registerEvents = registerEvents;
  private registerCommands = registerCommands;

  // Settings
  private async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  public async saveSettings() {
    await this.saveData(this.settings);
  }

  // Events
  public fire(event: ChangeEvent, file: TFile) {
    logger.log("Event", file.basename, event);
    if (event.type === "sort") {
      changeFrontmatter(file, [{ action: "sort" }], this.getContext());
    }
    if (event.type === "add-tag") {
      changeFrontmatter(
        file,
        [{ action: "tag-add", value: event.value }],
        this.getContext()
      );
    }
    if (event.type === "remove-tag") {
      changeFrontmatter(
        file,
        [{ action: "tag-remove", value: event.value }],
        this.getContext()
      );
    }
    if (event.type === "replace-tag") {
      changeFrontmatter(
        file,
        [
          {
            action: "tag-replace",
            value: event.value,
            oldValue: event.oldValue,
          },
        ],
        this.getContext()
      );
    }
    if (event.type === "set-alias") {
      changeFrontmatter(
        file,
        [
          {
            action: event.override ? "alias-set" : "alias-add",
            value: event.value,
          },
        ],
        this.getContext()
      );
    }
    if (event.type === "auto-update") {
      const changes = changesFromFilename(
        file,
        { override: event.override, oldPath: event.oldPath },
        this.getContext()
      );
      changeFrontmatter(file, changes, this.getContext());
    }
  }

  showChangeTagModal(abstract: TAbstractFile) {
    new UpdateTagModal(app, abstract, ({ action, value, oldValue }) => {
      for (const file of walk(abstract)) {
        if (action === "add") {
          this.fire({ type: "add-tag", value }, file);
        }
        if (action === "remove") {
          this.fire({ type: "remove-tag", value }, file);
        }
        if (action === "replace") {
          if (!value) {
            this.fire(
              {
                type: "remove-tag",
                value: oldValue,
              },
              file
            );
          } else {
            this.fire(
              {
                type: "replace-tag",
                value,
                oldValue,
              },
              file
            );
          }
        }
      }
    }).open();
  }
}
