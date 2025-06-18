import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { Logger } from "../../shared";
import { markWorkspacesCacheForRefresh } from "../vtex/cache";
import { getVtexAccount } from "../vtex/account";

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

    // Crear watchers para los archivos específicos con rutas absolutas para mejor monitoreo
    const sessionWatcher = vscode.workspace.createFileSystemWatcher(
      SESSION_FILE_PATH
    );

    const workspaceWatcher = vscode.workspace.createFileSystemWatcher(
      WORKSPACE_FILE_PATH
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
    workspaceWatcher.onDidChange(async () => {
      Logger.info(
        "Cambio detectado en workspace.json, actualizando barra de estado"
      );
      
      // Cuando cambia el archivo workspace.json desde fuera, marcamos la caché para refrescarla 
      // sin perder toda la información de caché
      const currentAccount = getVtexAccount();
      if (currentAccount) {
        Logger.info(`Marcando caché para refrescar para la cuenta ${currentAccount} debido a cambio externo en workspace.json`);
        await markWorkspacesCacheForRefresh(currentAccount);
      }
      
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
      // Watchers adicionales con patrón glob específico para session.json
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
      
      // Watcher adicional para workspace.json
      const additionalWorkspaceWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
          path.dirname(WORKSPACE_FILE_PATH),
          path.basename(WORKSPACE_FILE_PATH)
        )
      );

      additionalWorkspaceWatcher.onDidChange(async () => {
        Logger.info(
          "Cambio detectado en workspace.json (watcher adicional), actualizando barra de estado"
        );
        
        // Cuando cambia el archivo workspace.json desde fuera, marcamos la caché para refrescarla
        // sin perder toda la información de caché
        const currentAccount = getVtexAccount();
        if (currentAccount) {
          Logger.info(`Marcando caché para refrescar para la cuenta ${currentAccount} debido a cambio externo en workspace.json (watcher adicional)`);
          await markWorkspacesCacheForRefresh(currentAccount);
        }
        
        updateCallback();
      });

      // Último intento: watcher para cualquier cambio en el directorio .vtex/session
      const vtexSessionDirWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
          VTEX_SESSION_DIR,
          "*.json"
        )
      );

      vtexSessionDirWatcher.onDidChange(async (uri) => {
        Logger.info(
          `Cambio detectado en archivo JSON de VTEX (directorio watcher): ${uri.fsPath}`
        );
        
        // Si el cambio es en workspace.json, limpiamos el caché
        if (uri.fsPath.endsWith('workspace.json')) {
          const currentAccount = getVtexAccount();
          if (currentAccount) {
            Logger.info(`Marcando caché para refrescar para la cuenta ${currentAccount} debido a cambio en archivo workspace.json`);
            await markWorkspacesCacheForRefresh(currentAccount);
          }
        }
        
        updateCallback();
      });

      context.subscriptions.push(additionalSessionWatcher);
      context.subscriptions.push(additionalWorkspaceWatcher);
      context.subscriptions.push(vtexSessionDirWatcher);
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
