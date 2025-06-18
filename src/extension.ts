import * as vscode from "vscode";
import * as commands from "./commands";
import { COMMAND_KEYS, VTEX_COMMANDS } from "./constants";
import { Logger, VtexFileWatcher } from "./shared";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Activating VTEX IO Utilities extension");
  
  // Create and show status bar item first to ensure it's visible immediately
  try {
    // Use the centralized function to get the status bar item
    const statusBarItem = commands.getStatusBar();
    
    // Solo agregar a las suscripciones si hay un elemento de barra de estado
    if (statusBarItem) {
      context.subscriptions.push(statusBarItem);
      Logger.info("Status bar item created and added to subscriptions");
    } else {
      Logger.info("No VTEX account found, status bar is not displayed");
    }

    // Iniciar la monitorización de archivos VTEX
    const vtexWatcher = new VtexFileWatcher();
    vtexWatcher.startWatching(context, () => {
      commands.getStatusBar();
    });
    
    // As a backup, set up an interval to periodically check the files
    // This ensures that even if watchers fail, we'll have updates
    const intervalId = setInterval(() => {
      Logger.info("Periodic check of VTEX files");
      commands.getStatusBar();
    }, 30000); // Check every 30 seconds
    
    // Registrar el intervalo para limpiarlo cuando la extensión se desactive
    context.subscriptions.push({ dispose: () => clearInterval(intervalId) });
    
  } catch (error) {
    Logger.error(`Error displaying status bar item: ${error}`);
  }
  
  // Then register other commands
  registerCommands(context);
  
  Logger.info("VTEX IO Utilities extension activated");
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
      const statusBarItem = commands.getStatusBar();
      if (statusBarItem) {
        vscode.window.showInformationMessage("VTEX account information displayed in the status bar");
      } else {
        vscode.window.showWarningMessage("No active VTEX account information found");
      }
    }
  );

  const clickStatusBar = vscode.commands.registerCommand(
    COMMAND_KEYS.ClickStatusBar,
    () => {
      commands.handleStatusBarClick();
    }
  );

  // Reload VTEX Info command removed

  const clickWorkspaceStatusBar = vscode.commands.registerCommand(
    COMMAND_KEYS.ClickWorkspaceStatusBar,
    () => {
      commands.handleWorkspaceStatusBarClick();
    }
  );

  context.subscriptions.push(
    createDiagram,
    createDiagramContext,
    copyInstallCommand,
    copyDeployCommand,
    showStatusBar,
    clickStatusBar,
    clickWorkspaceStatusBar
  );

  Logger.info("VTEX IO Utilities is now active!");
}
