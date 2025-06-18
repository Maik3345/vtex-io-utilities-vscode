import * as vscode from "vscode";
import * as commands from "./commands";
import { COMMAND_KEYS, VTEX_COMMANDS } from "./constants";
import { Logger, VtexFileWatcher } from "./shared";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Activando extensión VTEX IO Utilities");
  
  // Create and show status bar item first to ensure it's visible immediately
  try {
    // Use the centralized function to get the status bar item
    const statusBarItem = commands.getStatusBar();
    
    // Solo agregar a las suscripciones si hay un elemento de barra de estado
    if (statusBarItem) {
      context.subscriptions.push(statusBarItem);
      Logger.info("Elemento de la barra de estado creado y agregado a las suscripciones");
    } else {
      Logger.info("No se encontró cuenta VTEX, no se muestra barra de estado");
    }

    // Iniciar la monitorización de archivos VTEX
    const vtexWatcher = new VtexFileWatcher();
    vtexWatcher.startWatching(context, () => {
      commands.getStatusBar();
    });
    
    // Como respaldo, configurar un intervalo para verificar los archivos periódicamente
    // Esto nos asegura que aún si los watchers fallan, tendremos actualizaciones
    const intervalId = setInterval(() => {
      Logger.info("Verificación periódica de archivos VTEX");
      commands.getStatusBar();
    }, 30000); // Verificar cada 30 segundos
    
    // Registrar el intervalo para limpiarlo cuando la extensión se desactive
    context.subscriptions.push({ dispose: () => clearInterval(intervalId) });
    
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
      const statusBarItem = commands.getStatusBar();
      if (statusBarItem) {
        vscode.window.showInformationMessage("Información de cuenta VTEX mostrada en la barra de estado");
      } else {
        vscode.window.showWarningMessage("No se encontró información de cuenta VTEX activa");
      }
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
