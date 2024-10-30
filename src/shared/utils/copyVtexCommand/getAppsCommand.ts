import { processFolders, readWorkspaceFolders } from "../workspace";
import * as vscode from "vscode";

export const getAppsCommand = async (
  command: string,
  contextPaths?: string[]
) => {
  let appsCommand: string = "";

  const { foldersToRead, manifestContent } = await readWorkspaceFolders(
    contextPaths,
    false
  );

  if (foldersToRead.length) {
    await processFolders(foldersToRead, manifestContent);
    manifestContent.forEach((manifestData, index) => {
      appsCommand += `${command} ${manifestData.vendor}.${manifestData.name}@${
        manifestData.version
      } ${index === manifestContent.length - 1 ? "" : "&& "}`;
    });
  }

  if (appsCommand === "") {
    vscode.window.showErrorMessage("No apps found in the selection.");
    return null;
  }

  vscode.window
    .showInformationMessage(
      "VTEX IO command copied to clipboard.",
      "Run in terminal"
    )
    .then((value) => {
      if (value === "Run in terminal") {
        vscode.commands.executeCommand("workbench.action.terminal.new");
        vscode.env.clipboard.writeText(appsCommand);
        vscode.commands.executeCommand("workbench.action.terminal.paste");
      }
    });
  vscode.env.clipboard.writeText(appsCommand);
  return appsCommand;
};
