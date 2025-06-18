import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { Logger } from "../../shared";

// Rutas a los archivos de configuración VTEX
export const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
export const SESSION_FILE_PATH = path.join(VTEX_SESSION_DIR, "session.json");
export const WORKSPACE_FILE_PATH = path.join(
  VTEX_SESSION_DIR,
  "workspace.json"
);

/**
 * Clase para manejar la monitorización de archivos VTEX y la actualización de la barra de estado
 */
export class VtexFileWatcher {
  private watcher: vscode.FileSystemWatcher | undefined;

  /**
   * Inicia la monitorización de los archivos VTEX
   * @param context El contexto de la extensión
   * @param updateCallback La función a llamar cuando se detecta un cambio
   */
  public startWatching(
    context: vscode.ExtensionContext,
    updateCallback: () => void
  ): void {
    Logger.info(
      `Iniciando monitorización de archivos VTEX en ${VTEX_SESSION_DIR}`
    );

    // Crear un watcher para monitorear cambios en la carpeta .vtex/session
    // Usamos los archivos específicos en lugar de un patrón para mayor precisión
    Logger.info(
      `Configurando watcher para ${SESSION_FILE_PATH} y ${WORKSPACE_FILE_PATH}`
    );

    // Crear watchers para los archivos específicos
    const sessionWatcher = vscode.workspace.createFileSystemWatcher(
      vscode.Uri.file(SESSION_FILE_PATH).fsPath
    );

    const workspaceWatcher = vscode.workspace.createFileSystemWatcher(
      vscode.Uri.file(WORKSPACE_FILE_PATH).fsPath
    );

    // Mantener una referencia al watcher principal para poder detenerlo después
    this.watcher = sessionWatcher;

    // Configurar los listeners para el archivo session.json
    sessionWatcher.onDidChange(() => {
      Logger.info(
        "Cambio detectado en session.json, actualizando barra de estado"
      );
      updateCallback();
    });

    sessionWatcher.onDidCreate(() => {
      Logger.info("Archivo session.json creado, actualizando barra de estado");
      updateCallback();
    });

    sessionWatcher.onDidDelete(() => {
      Logger.info(
        "Archivo session.json eliminado, actualizando barra de estado"
      );
      updateCallback();
    });

    // Configurar los listeners para el archivo workspace.json
    workspaceWatcher.onDidChange(() => {
      Logger.info(
        "Cambio detectado en workspace.json, actualizando barra de estado"
      );
      updateCallback();
    });

    workspaceWatcher.onDidCreate(() => {
      Logger.info(
        "Archivo workspace.json creado, actualizando barra de estado"
      );
      updateCallback();
    });

    workspaceWatcher.onDidDelete(() => {
      Logger.info(
        "Archivo workspace.json eliminado, actualizando barra de estado"
      );
      updateCallback();
    });

    // Agregar los watchers a las suscripciones para asegurar su liberación
    context.subscriptions.push(sessionWatcher);
    context.subscriptions.push(workspaceWatcher);

    // También registrar watchers directos a los archivos como alternativa
    try {
      // Watchers adicionales con patrón glob específico
      const additionalSessionWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
          path.dirname(SESSION_FILE_PATH),
          path.basename(SESSION_FILE_PATH)
        )
      );

      additionalSessionWatcher.onDidChange(() => {
        Logger.info(
          "Cambio detectado en session.json (watcher adicional), actualizando barra de estado"
        );
        updateCallback();
      });

      context.subscriptions.push(additionalSessionWatcher);
    } catch (error) {
      Logger.error(`Error al crear watchers adicionales: ${error}`);
    }

    Logger.info(
      "Monitorización de archivos VTEX iniciada con múltiples watchers"
    );
  }

  /**
   * Detiene la monitorización de archivos
   * Nota: Ya no es necesario llamar a este método manualmente, ya que los watchers
   * se agregan a context.subscriptions y VS Code se encargará de liberarlos
   */
  public stopWatching(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
      Logger.info("Monitorización de archivos VTEX detenida");
    }
  }
}
