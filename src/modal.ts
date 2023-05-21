import { App, Modal, Setting } from "obsidian";

export class UserEnteredTextModal extends Modal {
	result: string;

	constructor(
		app: App,
		private field: string,
		private onSubmit: (result: string) => void
	) {
		super(app);
	}

	submit() {
		this.close();
		this.onSubmit(this.result);
	}
	exit() {
		this.close();
	}

	onOpen() {
		const { contentEl } = this;

		this.scope.register([], "enter", (event: KeyboardEvent) => {
			this.submit();
			event.preventDefault();
			event.stopPropagation();
		});
		this.scope.register([], "esc", (event: KeyboardEvent) => {
			this.close();
			event.preventDefault();
			event.stopPropagation();
		});

		contentEl.createEl("h2", { text: `Add ${this.field}` });

		new Setting(contentEl).setName(this.field).addText((text) =>
			text.onChange((value) => {
				this.result = value;
			})
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add")
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
}
