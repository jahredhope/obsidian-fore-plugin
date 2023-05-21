import ForePlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface ForePluginSettings {
	aliasFromNameOnRename: boolean;
	autoAliasEvenWhenExisting: boolean;
	autoAliasPathMatch: string;
	tagFromFolderOnRename: boolean;
	enableTagsFromFolder: boolean;
	enableAliasFromName: boolean;
}

export const DEFAULT_SETTINGS: ForePluginSettings = {
	aliasFromNameOnRename: false,
	autoAliasEvenWhenExisting: false,
	autoAliasPathMatch:
		"{:date(\\d\\d\\d\\d-\\d\\d-\\d\\d) - }?{:kind - }?{:name}{, :descriptor}?",
	enableAliasFromName: true,
	enableTagsFromFolder: false,
	tagFromFolderOnRename: false,
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
			.setName("Enable Alias from File Name")
			.setDesc("Enabled creating Aliases from the File Name")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTagsFromFolder)
					.onChange(async (value) => {
						this.plugin.settings.enableTagsFromFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Add Alias from Filename on Rename")
			.setDesc("Regexp or Path Matcher to look for name")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.aliasFromNameOnRename)
					.onChange(async (value) => {
						this.plugin.settings.aliasFromNameOnRename = value;
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
			.setName("Enable Tags from Folder Structure")
			.setDesc("Enabled creating Tags from the Folder Structure")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTagsFromFolder)
					.onChange(async (value) => {
						this.plugin.settings.enableTagsFromFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Update Tag from Folder on Rename")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.tagFromFolderOnRename)
					.onChange(async (value) => {
						this.plugin.settings.tagFromFolderOnRename = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
