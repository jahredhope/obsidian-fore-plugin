import ForePlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

interface CustomProperty {
  field: string;
  auto: boolean;
  override: boolean;
}

export interface ForePluginSettings {
  aliasFromNameOnRename: boolean;
  autoAliasEvenWhenExisting: boolean;
  autoAliasPathMatch: string;
  enableAliasFromName: boolean;
  autoCustomProperties: CustomProperty[];
  sortOnChange: boolean;
  aliasFieldName: string;
}

export const DEFAULT_SETTINGS: ForePluginSettings = {
  aliasFromNameOnRename: true,
  autoAliasEvenWhenExisting: false,
  autoAliasPathMatch:
    "{:date(\\d\\d\\d\\d-\\d\\d-\\d\\d) - }?{:kind - }?{:name}{, :descriptor}?",
  enableAliasFromName: true,
  autoCustomProperties: [{ field: "kind", auto: false, override: false }],
  sortOnChange: false,
  aliasFieldName: "name",
};

export class AutoFrontmatterSettingTab extends PluginSettingTab {
  plugin: ForePlugin;

  constructor(app: App, plugin: ForePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Fore Settings" });

    new Setting(containerEl)
      .setName("Path")
      .setDesc("Regexp or Path Matcher used to parse file names")
      .addTextArea((text) =>
        text
          .setPlaceholder(":name, :descriptor")
          .setValue(this.plugin.settings.autoAliasPathMatch)
          .onChange((value) =>
            this.updateSettings(
              () => (this.plugin.settings.autoAliasPathMatch = value)
            )
          )
      );

    new Setting(containerEl)
      .setName("Sort Frontmatter on Change")
      .setDesc("Regexp or Path Matcher parse file names")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.sortOnChange)
          .onChange((value) =>
            this.updateSettings((settings) => (settings.sortOnChange = value))
          )
      );

    containerEl.createEl("h3", { text: "Alias from File Name" });

    new Setting(containerEl)
      .setName("Enable")
      .setDesc("Enable creating Aliases from the File Name")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAliasFromName)
          .onChange((value) =>
            this.updateSettings(
              (settings) => (settings.enableAliasFromName = value)
            )
          )
      );

    new Setting(containerEl)
      .setName("Alias Field Name")
      .setDesc("What value to look for in the path match")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.aliasFieldName)
          .onChange((value) =>
            this.updateSettings((settings) => (settings.aliasFieldName = value))
          )
      );

    new Setting(containerEl)
      .setName("Update on Rename")
      .setDesc("Update Alias if it doesn't exist")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.aliasFromNameOnRename)
          .onChange((value) =>
            this.updateSettings((settings) => {
              settings.aliasFromNameOnRename = value;
            })
          )
      );

    new Setting(containerEl)
      .setName("Override existing")
      .setDesc("Update alias even if it exists")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoAliasEvenWhenExisting)
          .onChange((value) =>
            this.updateSettings((settings) => {
              settings.autoAliasEvenWhenExisting = value;
            })
          )
      );

    containerEl.createEl("h3", { text: "Custom Properties" });

    const customPropertiesContainer = containerEl.createEl("div");

    this.renderCustomProperties(customPropertiesContainer);

    new Setting(containerEl).addButton((button) =>
      button.setIcon("plus").onClick(() => {
        this.plugin.settings.autoCustomProperties.push({
          field: "",
          auto: false,
          override: false,
        });
        this.renderCustomProperties(customPropertiesContainer);
      })
    );
  }

  private renderCustomProperties(containerEl: HTMLElement) {
    containerEl.replaceChildren();

    this.plugin.settings.autoCustomProperties.forEach((prop) => {
      new Setting(containerEl)
        .addText((text) => {
          text
            .setPlaceholder("Field")
            .setValue(prop.field)
            .onChange((value) =>
              this.updateSettings(() => {
                prop.field = value;
              })
            );
        })
        .addToggle((toggle) =>
          toggle
            .setTooltip("Update on rename")
            .setValue(prop.auto)
            .onChange((value) =>
              this.updateSettings(() => {
                prop.auto = value;
              })
            )
        )
        .addToggle((toggle) =>
          toggle
            .setTooltip("Override if already set")
            .setValue(prop.override)
            .onChange((value) =>
              this.updateSettings(() => {
                prop.override = value;
              })
            )
        )
        .addButton((button) =>
          button
            .setIcon("cross")
            .setWarning()
            .onClick(async () => {
              await this.updateSettings((settings) => {
                settings.autoCustomProperties.splice(
                  settings.autoCustomProperties.indexOf(prop),
                  1
                );
              });
              this.renderCustomProperties(containerEl);
            })
        );
    });
  }

  private updateSettings(callback: (settings: ForePluginSettings) => void) {
    callback(this.plugin.settings);
    return this.plugin.saveSettings();
  }
}
