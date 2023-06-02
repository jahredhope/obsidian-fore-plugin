import { TAbstractFile, TFile, TFolder } from "obsidian";

/**
 * Walks the given folder, yielding to every file found.
 *
 * If given a file, will yield that file
 *
 * Useful for performing an action on every file in a directory.
 */
export function* walk(file: TAbstractFile): Generator<TFile> {
	if (file instanceof TFile) {
		yield file;
	}
	if (file instanceof TFolder) {
		for (const child of file.children) {
			yield* walk(child);
		}
	}
}
