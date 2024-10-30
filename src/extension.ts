import * as vscode from "vscode";
import * as commands from "./commands";
import { COMMAND_KEYS, VTEX_COMMANDS } from "./constants";
import { Logger } from "./shared";

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
}

function registerCommands(context: vscode.ExtensionContext) {
  const createDiagram = vscode.commands.registerCommand(
    COMMAND_KEYS.CreateDiagram,
    async () => {
      await commands.createDiagram(context);
    }
  );

  const createDiagramContext = vscode.commands.registerCommand(
    COMMAND_KEYS.CreateDiagramFromContext,
    async (uri: vscode.Uri, uris: vscode.Uri[]) => {
      const paths = uris.length ? uris.map((u) => u.fsPath) : [uri.fsPath];
      await commands.createDiagram(context, paths);
    }
  );

  const copyInstallCommand = vscode.commands.registerCommand(
    COMMAND_KEYS.CopyInstallCommand,
    async (uri: vscode.Uri, uris: vscode.Uri[]) => {
      const paths = uris.length ? uris.map((u) => u.fsPath) : [uri.fsPath];
      await commands.copyVtexCommand(VTEX_COMMANDS.Install, paths);
    }
  );

  const copyDeployCommand = vscode.commands.registerCommand(
    COMMAND_KEYS.CopyDeployCommand,
    async (uri: vscode.Uri, uris: vscode.Uri[]) => {
      const paths = uris.length ? uris.map((u) => u.fsPath) : [uri.fsPath];
      await commands.copyVtexCommand(VTEX_COMMANDS.Deploy, paths);
    }
  );

  context.subscriptions.push(
    createDiagram,
    createDiagramContext,
    copyInstallCommand,
    copyDeployCommand
  );

  Logger.info("VTEX IO Utilities is now active!");
}
