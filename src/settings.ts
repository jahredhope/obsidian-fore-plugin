import ForePlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface ForePluginSettings {
	autoAliasFromName: boolean;
	autoAliasEvenWhenExisting: boolean;
	autoAliasPathMatch: string;
	autoTagFromFolder: boolean;
}

export const DEFAULT_SETTINGS: ForePluginSettings = {
	autoAliasFromName: false,
	autoAliasEvenWhenExisting: false,
	autoAliasPathMatch:
		"{:date(\\d\\d\\d\\d-\\d\\d-\\d\\d) - }?{:kind - }?{:name}{, :descriptor}?",
	autoTagFromFolder: false,
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

		containerEl.createEl("h2", { text: "Auto Front Matter Settings" });

		new Setting(containerEl)
			.setName("Add Alias from Filename on Rename")
			.setDesc("Regexp or Path Matcher to look for name")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoAliasFromName)
					.onChange(async (value) => {
						this.plugin.settings.autoAliasFromName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto Alias Path Matcher")
			.setDesc("Regexp or Path Matcher to look for name")
			.addText((text) =>
				text
					.setPlaceholder(":name, :descriptor")
					.setValue(this.plugin.settings.autoAliasPathMatch)
					.onChange(async (value) => {
						this.plugin.settings.autoAliasPathMatch = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Add Tag from Folder on Rename")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoTagFromFolder)
					.onChange(async (value) => {
						this.plugin.settings.autoTagFromFolder = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
