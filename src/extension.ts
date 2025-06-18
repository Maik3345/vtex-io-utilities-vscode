import * as vscode from "vscode";
import * as commands from "./commands";
import { COMMAND_KEYS, VTEX_COMMANDS } from "./constants";
import { Logger } from "./shared";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Activando extensión VTEX IO Utilities");
  
  // Create and show status bar item first to ensure it's visible immediately
  try {
    // Use the centralized function to get the status bar item
    const statusBarItem = commands.getStatusBar();
    // Push to context subscriptions to ensure proper disposal
    context.subscriptions.push(statusBarItem);
    Logger.info("Elemento de la barra de estado creado y agregado a las suscripciones");
  } catch (error) {
    Logger.error(`Error al mostrar el elemento de la barra de estado: ${error}`);
  }
  
  // Then register other commands
  registerCommands(context);
  
  Logger.info("Extensión VTEX IO Utilities activada");
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

  const showStatusBar = vscode.commands.registerCommand(
    COMMAND_KEYS.ShowStatusBar,
    () => {
      // Use the centralized function to show the status bar
      commands.getStatusBar();
      vscode.window.showInformationMessage("Elemento 'Hola mundo' mostrado en la barra de estado");
    }
  );

  const clickStatusBar = vscode.commands.registerCommand(
    COMMAND_KEYS.ClickStatusBar,
    () => {
      commands.handleStatusBarClick();
    }
  );

  context.subscriptions.push(
    createDiagram,
    createDiagramContext,
    copyInstallCommand,
    copyDeployCommand,
    showStatusBar,
    clickStatusBar
  );

  Logger.info("VTEX IO Utilities is now active!");
}
