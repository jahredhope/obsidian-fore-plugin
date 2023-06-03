import { Modal, App, Setting, TAbstractFile } from "obsidian";
import { countFiles } from "./walk-files";

interface ReplaceTagResult {
  oldValue: string;
  value: string;
  action: "add" | "remove" | "replace";
}

type Action = "add" | "remove" | "replace";

export class UpdateTagModal extends Modal {
  result: ReplaceTagResult;
  fieldsEl: HTMLDivElement;
  headingEl: HTMLHeadingElement;
  showFocus = true;
  fileCount = 0;

  constructor(
    app: App,
    private file: TAbstractFile,
    private onSubmit: (result: ReplaceTagResult) => void
  ) {
    super(app);
    this.result = { oldValue: "", value: "", action: "add" };
  }

  onOpen() {
    const { contentEl } = this;

    this.scope.register([], "enter", (event: KeyboardEvent) => {
      this.submit();
      event.preventDefault();
      event.stopPropagation();
    });

    this.fileCount = countFiles(this.file);
    this.fieldsEl = contentEl.createDiv();
    this.render();
  }

  render() {
    const { contentEl } = this;
    if (!contentEl) return;

    contentEl.replaceChildren();

    const { action } = this.result;

    this.headingEl = contentEl.createEl("h2", {
      text: this.fileCount > 1 ? `Update Tag for Files` : "Update Tag for File",
    });

    const setting = new Setting(contentEl);

    setting.addDropdown((dropdown) =>
      dropdown
        .addOption("add", "Add")
        .addOption("remove", "Remove")
        .addOption("replace", "Replace")
        .setValue(this.result.action)
        .onChange((value: Action) => {
          this.result.action = value;
          this.render();
        })
    );

    if (action === "replace")
      // new Setting(contentEl).setName("Replace")
      setting.addText((text) =>
        text
          .setValue(this.result.oldValue)
          .setPlaceholder("Value to replace")
          .onChange((value) => {
            this.result.oldValue = value;
          })
      );

    setting.addText((text) => {
      text
        .setPlaceholder(`Value to ${action === "remove" ? "remove" : "add"}`)
        .setValue(this.result.value)
        .onChange((value) => {
          this.result.value = value;
        });

      if (this.showFocus) {
        this.showFocus = false;
        text.inputEl.focus();
        // Hack to ensure focus gets set. Otherwise Obsidian will focus the first element.
        setTimeout(() => {
          text.inputEl.focus();
        }, 0);
      } else {
        console.log("not setting focus");
      }
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText(this.getCTA())
        .setCta()
        .onClick(() => {
          this.submit();
        })
    );
  }

  private getCTA() {
    switch (this.result.action) {
      case "add":
        return "Add";
      case "remove":
        return "Remove";
      case "replace":
        return "Replace";
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private submit() {
    this.close();
    this.onSubmit(this.result);
  }
}
