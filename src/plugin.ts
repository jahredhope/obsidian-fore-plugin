import {
	Editor,
	MarkdownView,
	parseFrontMatterAliases,
	Plugin,
	TFile,
} from "obsidian";
import { dirname } from "path";
import { createMatcher } from "src/matcher";
import { AutoFrontmatterSettingTab } from "src/settings";
import {
	formatToTagName,
	getUsedKey,
	parseFrontMatterTagsRaw,
} from "./frontmatter";

interface AutoFrontMatterSettings {
	autoAliasFromName: boolean;
	autoAliasPathMatch: string;
	autoTagFromFolder: boolean;
}

const DEFAULT_SETTINGS: AutoFrontMatterSettings = {
	autoAliasFromName: false,
	autoAliasPathMatch: ":name, :descriptor",
	autoTagFromFolder: false,
};

export class AutoFrontMatter extends Plugin {
	settings: AutoFrontMatterSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Auto  - Status Bar Text");

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file: TFile) => {
				if (!file.basename) {
					// Is a directory
					return;
				}
				menu.addItem((item) => {
					item.setTitle("Update Tags from Path")
						.setIcon("document")
						.onClick(async () => {
							this.updateTagsFromPath(file);
						});
				});

				menu.addItem((item) => {
					item.setTitle("Update Alias from Name")
						.setIcon("document")
						.onClick(async () => {
							this.updateAliasFromFilename(file);
						});
				});
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file: TFile) => {
				console.log("File Renamed", { basename: file.basename });
				if (this.settings.autoTagFromFolder)
					this.updateTagsFromPath(file);
				if (this.settings.autoAliasFromName)
					this.updateAliasFromFilename(file);
			})
		);

		this.addCommand({
			id: "update-tags-from-path",
			name: "Update Tags from File Path",
			editorCallback: (_editor: Editor, view: MarkdownView) => {
				this.updateTagsFromPath(view.file);
			},
		});

		this.addCommand({
			id: "update-alias-from-name",
			name: "Update Alias from File Name",
			editorCallback: (_editor: Editor, view: MarkdownView) => {
				this.updateAliasFromFilename(view.file);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AutoFrontmatterSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateTagsFromPath(file: TFile) {
		const tagFromPath = formatToTagName(dirname(file.path));
		if (!tagFromPath) {
			return;
		}
		this.addTag(file, tagFromPath);
	}

	addTag(file: TFile, tag: string) {
		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				const key = getUsedKey(frontmatter, ["tag", "tags"]);
				const formatAsCommaSeparated = !Array.isArray(frontmatter[key]);
				const tags = parseFrontMatterTagsRaw(frontmatter);
				if (!tags.includes(tag)) {
					console.log(`Adding ${tag} as tag`);
					tags.push(tag);
				}
				frontmatter[key] = formatAsCommaSeparated
					? tags.join(", ")
					: tags;
			}
		);
	}

	updateAliasFromFilename(file: TFile) {
		if (!this.settings.autoAliasPathMatch) return;

		//"{:date(\\d\\d\\d\\d-\\d\\d-\\d\\d) - }?{:kind - }?{:name}{, :descriptor}?"
		const getValuesFromName = createMatcher(
			this.settings.autoAliasPathMatch
		);
		const values = getValuesFromName(file.basename);
		if (!values || !values.name) {
			console.log("No name found");
			return;
		}
		if (values.name === file.basename) {
			console.log("Name is the same as full name");
			return;
		}

		this.addAlias(file, values.name);
	}

	addAlias(file: TFile, alias: string) {
		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				const key = getUsedKey(frontmatter, ["alias", "aliases"]);
				const formatAsCommaSeparated = !Array.isArray(frontmatter[key]);
				const aliases = parseFrontMatterAliases(frontmatter) || [];
				if (!aliases.includes(alias)) {
					console.log(`Adding ${alias} as alias`);
					aliases.push(alias);
				}
				frontmatter[key] = formatAsCommaSeparated
					? aliases.join(", ")
					: aliases;
			}
		);
	}
}
