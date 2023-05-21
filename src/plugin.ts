import {
	Editor,
	MarkdownView,
	Menu,
	parseFrontMatterAliases,
	Plugin,
	TFile,
} from "obsidian";
import { dirname } from "path";
import { createMatcher } from "src/matcher";
import {
	AutoFrontmatterSettingTab,
	DEFAULT_SETTINGS,
	ForePluginSettings,
} from "src/settings";
import { FileSystemObject, walk } from "./files";
import {
	formatToTagName,
	getUsedKey,
	parseFrontMatterTagsRaw,
} from "./frontmatter";
import { ReplaceTagModal, UserEnteredTextModal } from "./modal";
import { formatAsTag } from "./tags";

interface Logger {
	log: (...params: unknown[]) => void;
}
const DEBUGGING = false;
const logger: Logger = DEBUGGING ? console : { log: () => {} };

export class ForePlugin extends Plugin {
	settings: ForePluginSettings;

	public async onload() {
		await this.loadSettings();

		this.addSettingTab(new AutoFrontmatterSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				(menu, abstract: FileSystemObject) => {
					this.onFileMenu(menu, abstract);
				}
			)
		);

		this.registerEvent(
			this.app.vault.on("create", (file: TFile) => {
				logger.log("File Renamed", { basename: file.basename });
				if (this.settings.tagFromFolderOnRename)
					this.updateTagsFromPath(file);
				if (this.settings.aliasFromNameOnRename)
					this.updateAliasFromFilename(file, { override: false });
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file: TFile) => {
				logger.log("File Renamed", { basename: file.basename });
				if (this.settings.tagFromFolderOnRename)
					this.updateTagsFromPath(file);
				if (this.settings.aliasFromNameOnRename)
					this.updateAliasFromFilename(file, { override: false });
			})
		);
		this.updateCommands();
	}

	public onunload() {}

	private updateCommands() {
		this.addCommand({
			id: "update-tags-from-path",
			name: "Update Tags from File Path",
			editorCheckCallback: (
				checking,
				_editor: Editor,
				view: MarkdownView
			) => {
				if (checking) {
					return this.settings.enableTagsFromFolder;
				}
				this.updateTagsFromPath(view.file);
			},
		});

		this.addCommand({
			id: "update-alias-from-name",
			name: "Update Alias from File Name",
			editorCheckCallback: (
				checking,
				_editor: Editor,
				view: MarkdownView
			) => {
				if (checking) {
					return this.settings.enableAliasFromName;
				}
				this.updateAliasFromFilename(view.file, { override: true });
			},
		});

		this.addCommand({
			id: "add-alias-to-frontmatter",
			name: "Add Alias to Frontmatter",
			editorCallback: (_editor: Editor, view: MarkdownView) => {
				new UserEnteredTextModal(
					this.app,
					{ field: "Alias", callToAction: "Add" },
					(value) => {
						this.addAlias(view.file, value, true);
					}
				).open();
			},
		});

		this.addCommand({
			id: "add-tag-to-frontmatter",
			name: "Add Tag to Frontmatter",
			editorCallback: (_editor: Editor, view: MarkdownView) => {
				new UserEnteredTextModal(
					this.app,
					{ field: "Tag", callToAction: "Add" },
					(value) => {
						this.addTag(view.file, value);
					}
				).open();
			},
		});
	}

	private onFileMenu(menu: Menu, abstract: FileSystemObject) {
		menu.addSeparator();

		menu.addItem((item) => {
			item.setTitle("Fore: Add Tag")
				.setIcon("document")
				.onClick(async () => {
					new UserEnteredTextModal(
						this.app,
						{ field: "Tag", callToAction: "Add" },
						(value) => {
							for (const file of walk(abstract)) {
								this.addTag(file, value);
							}
						}
					).open();
				});
		});

		menu.addItem((item) => {
			item.setTitle("Fore: Remove Tag")
				.setIcon("document")
				.onClick(async () => {
					new UserEnteredTextModal(
						this.app,
						{ field: "Tag", callToAction: "Remove" },
						(value) => {
							for (const file of walk(abstract)) {
								this.removeTag(file, value);
							}
						}
					).open();
				});
		});

		menu.addItem((item) => {
			item.setTitle("Fore: Replace Tag")
				.setIcon("document")
				.onClick(async () => {
					new ReplaceTagModal(this.app, ({ oldTag, newTag }) => {
						for (const file of walk(abstract)) {
							this.removeTag(file, oldTag, newTag);
						}
					}).open();
				});
		});

		if (this.settings.enableTagsFromFolder) {
			menu.addItem((item) => {
				item.setTitle("Fore: Auto Update Tags")
					.setIcon("document")
					.onClick(async () => {
						for (const file of walk(abstract)) {
							this.updateTagsFromPath(file);
						}
					});
			});
		}

		if (this.settings.enableAliasFromName) {
			menu.addItem((item) => {
				item.setTitle("Fore: Auto Update Alias")
					.setIcon("document")
					.onClick(async () => {
						for (const file of walk(abstract)) {
							this.updateAliasFromFilename(file, {
								override: false,
							});
						}
					});
			});
		}
		menu.addSeparator();
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private updateTagsFromPath(file: TFile) {
		const tagFromPath = formatToTagName(dirname(file.path));
		if (!tagFromPath) {
			return;
		}
		this.addTag(file, tagFromPath);
	}

	private addTag(file: TFile, tag: string) {
		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				const key = getUsedKey(frontmatter, ["tag", "tags"]);
				const formatAsCommaSeparated = !Array.isArray(frontmatter[key]);
				const tags = parseFrontMatterTagsRaw(frontmatter);
				const formattedTag = formatAsTag(tag);

				if (tags.includes(formattedTag)) {
					return;
				}

				logger.log(`Adding ${formattedTag} as tag`);
				tags.push(formattedTag);

				frontmatter[key] = formatAsCommaSeparated
					? tags.join(", ")
					: tags;
			}
		);
	}

	private removeTag(file: TFile, tag: string, newTag?: string) {
		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				const key = getUsedKey(frontmatter, ["tag", "tags"]);
				const formatAsCommaSeparated = !Array.isArray(frontmatter[key]);
				const tags = parseFrontMatterTagsRaw(frontmatter);
				const index = tags.findIndex(
					(existingTag) => existingTag === tag
				);
				if (index === -1) return;

				if (newTag) {
					const formattedNewTag = formatAsTag(newTag);
					tags.splice(index, 1, formattedNewTag);
				} else {
					tags.splice(index, 1);
				}

				if (tags.length === 0) {
					delete frontmatter[key];
				} else {
					frontmatter[key] = formatAsCommaSeparated
						? tags.join(", ")
						: tags;
				}
			}
		);
	}

	private updateAliasFromFilename(
		file: TFile,
		{ override }: { override: boolean }
	) {
		if (!this.settings.autoAliasPathMatch) return;

		const getValuesFromName = createMatcher(
			this.settings.autoAliasPathMatch
		);
		const values = getValuesFromName(file.basename);
		if (!values || !values.name) {
			logger.log("No name found");
			return;
		}
		if (values.name === file.basename) {
			logger.log("Name is the same as full name");
			return;
		}

		this.addAlias(file, values.name, override);
	}

	private addAlias(file: TFile, alias: string, force = false) {
		this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				const key = getUsedKey(frontmatter, ["alias", "aliases"]);
				const formatAsCommaSeparated = !Array.isArray(frontmatter[key]);
				const aliases = parseFrontMatterAliases(frontmatter) || [];
				if (
					!force &&
					!this.settings.autoAliasEvenWhenExisting &&
					aliases.length > 0
				) {
					logger.log("Alias already exists");
					return;
				}
				if (!aliases.includes(alias)) {
					logger.log(`Adding ${alias} as alias`);
					aliases.push(alias);
				}
				frontmatter[key] = formatAsCommaSeparated
					? aliases.join(", ")
					: aliases;
			}
		);
	}
}
