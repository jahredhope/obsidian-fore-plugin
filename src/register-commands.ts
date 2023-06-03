import { Editor, MarkdownView } from "obsidian";
import { ForePlugin } from "./plugin";

export function registerCommands(this: ForePlugin) {
  this.addCommand({
    id: "update-from-name",
    name: "Update from File Name",
    editorCheckCallback: (checking, _editor: Editor, view: MarkdownView) => {
      if (checking) {
        return this.settings.enableAliasFromName;
      }
      this.fire({ type: "auto-update", override: false }, view.file);
    },
  });

  this.addCommand({
    id: "override-from-name",
    name: "Override from File Name",
    editorCheckCallback: (checking, _editor: Editor, view: MarkdownView) => {
      if (checking) {
        return this.settings.enableAliasFromName;
      }
      this.fire({ type: "auto-update", override: true }, view.file);
    },
  });

  this.addCommand({
    id: "sort-frontmatter",
    name: "Sort Frontmatter",
    editorCallback: (_editor: Editor, view: MarkdownView) => {
      this.fire({ type: "sort" }, view.file);
    },
  });

  this.addCommand({
    id: "add-tag-to-frontmatter",
    name: "Add Tag to Frontmatter",
    editorCallback: (_editor: Editor, view: MarkdownView) => {
      this.showChangeTagModal(view.file);
    },
  });
}
