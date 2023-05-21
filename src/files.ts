import { TFile, TFolder } from "obsidian";

export type FileSystemObject = TFile | TFolder;

/**
 * Walks the given folder, yielding to every file found. Will yield once on a file.
 *
 * Useful for performing an action on every file in a directory.
 *
 * @param file Either a TFile or TFolder
 */
export function* walk(file: FileSystemObject): Generator<TFile> {
	if ("basename" in file) {
		yield file;
	}
	if ("children" in file) {
		for (const child of file.children) {
			yield* walk(child as FileSystemObject);
		}
	}
}
