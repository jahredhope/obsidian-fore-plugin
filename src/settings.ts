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
	aliasFromNameOnRename: true,
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

		containerEl.createEl("h2", { text: "Fore Settings" });

		containerEl.createEl("h3", { text: "Alias from File Name" });

		new Setting(containerEl)
			.setName("Enable")
			.setDesc("Enable creating Aliases from the File Name")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableAliasFromName)
					.onChange(async (value) => {
						this.plugin.settings.enableAliasFromName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Update on Rename")
			.setDesc("Update Alias if it doesn't exist")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.aliasFromNameOnRename)
					.onChange(async (value) => {
						this.plugin.settings.aliasFromNameOnRename = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Override existing")
			.setDesc("Update alias even if it exists")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoAliasEvenWhenExisting)
					.onChange(async (value) => {
						this.plugin.settings.autoAliasEvenWhenExisting = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Path")
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

		containerEl.createEl("h3", { text: "Tags from Folder Structure" });

		new Setting(containerEl)
			.setName("Enable")
			.setDesc("Enable creating Tags from the Folder Structure")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTagsFromFolder)
					.onChange(async (value) => {
						this.plugin.settings.enableTagsFromFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Update on Rename")
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
