import { App, Modal, Setting } from "obsidian";

interface UserEnteredTextOptions {
	field: string;
	callToAction: string;
}

export class UserEnteredTextModal extends Modal {
	result: string;

	constructor(
		app: App,
		private options: UserEnteredTextOptions,
		private onSubmit: (result: string) => void
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		this.scope.register([], "enter", (event: KeyboardEvent) => {
			this.submit();
			event.preventDefault();
			event.stopPropagation();
		});

		contentEl.createEl("h2", {
			text: `${this.options.callToAction} ${this.options.field}`,
		});

		new Setting(contentEl).setName(this.options.field).addText((text) =>
			text.onChange((value) => {
				this.result = value;
			})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(this.options.callToAction)
				.setCta()
				.onClick(() => {
					this.submit();
				})
		);
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

interface ReplaceTagResult {
	oldTag: string;
	newTag: string;
}

export class ReplaceTagModal extends Modal {
	result: ReplaceTagResult;

	constructor(
		app: App,
		private onSubmit: (result: ReplaceTagResult) => void
	) {
		super(app);
		this.result = { oldTag: "", newTag: "" };
	}

	onOpen() {
		const { contentEl } = this;

		this.scope.register([], "enter", (event: KeyboardEvent) => {
			this.submit();
			event.preventDefault();
			event.stopPropagation();
		});

		contentEl.createEl("h2", {
			text: `Replace Tag`,
		});

		new Setting(contentEl).setName("Old Tag").addText((text) =>
			text.onChange((value) => {
				this.result.oldTag = value;
			})
		);

		new Setting(contentEl).setName("New Tag").addText((text) =>
			text.onChange((value) => {
				this.result.newTag = value;
			})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Replace")
				.setCta()
				.onClick(() => {
					this.submit();
				})
		);
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
