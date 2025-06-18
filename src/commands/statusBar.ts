import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger, IconManager } from "../shared";

// Variable global para el elemento de la barra de estado
let statusBarItem: vscode.StatusBarItem | undefined;

// Rutas a los archivos de configuración VTEX
const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
const SESSION_FILE_PATH = path.join(VTEX_SESSION_DIR, "session.json");
const WORKSPACE_FILE_PATH = path.join(VTEX_SESSION_DIR, "workspace.json");

/**
 * Interfaz para la información VTEX completa
 */
interface VtexInfo {
  account?: string;
  workspace?: string;
}

/**
 * Lee el archivo session.json y obtiene el nombre de la cuenta VTEX
 * @returns El nombre de la cuenta o undefined si el archivo no existe o no tiene el campo account
 */
function getVtexAccount(): string | undefined {
  try {
    Logger.info(`Intentando leer archivo de sesión: ${SESSION_FILE_PATH}`);

    // Verificar si el archivo existe
    if (!fs.existsSync(SESSION_FILE_PATH)) {
      Logger.info("El archivo session.json no existe");
      return undefined;
    }

    // Leer y parsear el archivo
    const sessionContent = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
    const sessionData = JSON.parse(sessionContent);

    // Verificar si tiene el campo account
    if (!sessionData.account) {
      Logger.info("El archivo session.json no contiene el campo account");
      return undefined;
    }

    Logger.info(`Cuenta VTEX encontrada: ${sessionData.account}`);
    return sessionData.account;
  } catch (error) {
    Logger.error(`Error al leer el archivo de sesión VTEX: ${error}`);
    return undefined;
  }
}

/**
 * Lee el archivo workspace.json y obtiene el workspace actual
 * @returns El nombre del workspace o undefined si el archivo no existe o no tiene el campo currentWorkspace
 */
function getVtexWorkspace(): string | undefined {
  try {
    Logger.info(`Intentando leer archivo de workspace: ${WORKSPACE_FILE_PATH}`);

    // Verificar si el archivo existe
    if (!fs.existsSync(WORKSPACE_FILE_PATH)) {
      Logger.info("El archivo workspace.json no existe");
      return undefined;
    }

    // Leer y parsear el archivo
    const workspaceContent = fs.readFileSync(WORKSPACE_FILE_PATH, "utf-8");
    const workspaceData = JSON.parse(workspaceContent);

    // Verificar si tiene el campo currentWorkspace
    if (!workspaceData.currentWorkspace) {
      Logger.info(
        "El archivo workspace.json no contiene el campo currentWorkspace"
      );
      return undefined;
    }

    Logger.info(`Workspace VTEX encontrado: ${workspaceData.currentWorkspace}`);
    return workspaceData.currentWorkspace;
  } catch (error) {
    Logger.error(`Error al leer el archivo de workspace VTEX: ${error}`);
    return undefined;
  }
}

/**
 * Obtiene la información completa de VTEX (cuenta y workspace)
 * @returns Objeto con la información de cuenta y workspace
 */
function getVtexInfo(): VtexInfo {
  const account = getVtexAccount();
  const workspace = getVtexWorkspace();

  return { account, workspace };
}

/**
 * Crea o recupera el elemento de la barra de estado.
 * Lee los archivos session.json y workspace.json para mostrar la información de VTEX.
 * @returns El elemento de la barra de estado o undefined si no hay cuenta VTEX
 */
export function getStatusBar(): vscode.StatusBarItem | undefined {
  Logger.info("Solicitando elemento de barra de estado para VTEX");

  // Obtener la información de VTEX
  const vtexInfo = getVtexInfo();

  // Si no hay cuenta, no mostrar nada y devolver undefined
  if (!vtexInfo.account) {
    if (statusBarItem) {
      statusBarItem.hide();
      Logger.info("Ocultando barra de estado porque no hay cuenta VTEX activa");
    }
    return undefined;
  }

  // Crear el elemento de la barra de estado si no existe
  if (!statusBarItem) {
    Logger.info("Creando nuevo elemento de barra de estado para VTEX");
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.command = "vtex-io-utilities-vscode.clickStatusBar";
  }

  // Aplicar un color según el workspace para destacar visualmente
  if (vtexInfo.workspace === "master") {
    // Para master: color verde para indicar producción
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  } else if (vtexInfo.workspace) {
    // Para otros workspaces: color amarillo/naranja para indicar desarrollo
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.background"
    );
  } else {
    // Sin workspace: color neutro
    statusBarItem.backgroundColor = undefined;
  }

  // Obtener el icono adecuado según el contexto usando nuestra clase IconManager
  const iconType = IconManager.getVtexIcon(vtexInfo.workspace);

  // Formatear el texto para la barra de estado con el icono correspondiente
  let displayText = `$(vtex-logo) ${vtexInfo.account} ${iconType} `;
  if (vtexInfo.workspace) {
    displayText = `$(vtex-logo) ${vtexInfo.account}:${vtexInfo.workspace} ${iconType}`;
  }

  // Formatear el texto para el tooltip
  let tooltipText = `Cuenta VTEX activa: ${vtexInfo.account}`;
  if (vtexInfo.workspace) {
    tooltipText = `Cuenta VTEX activa: ${vtexInfo.account}\nWorkspace: ${vtexInfo.workspace}`;
  }

  // Actualizar texto y tooltip
  statusBarItem.text = displayText;
  statusBarItem.tooltip = tooltipText;

  // Mostrar el elemento en la barra de estado
  statusBarItem.show();
  Logger.info(
    `Elemento de barra de estado para VTEX '${displayText}' mostrado`
  );

  return statusBarItem;
}

/**
 * Maneja el evento de clic en el elemento de la barra de estado.
 */
export function handleStatusBarClick(): void {
  const vtexInfo = getVtexInfo();

  if (vtexInfo.account) {
    let message = `Cuenta VTEX activa: ${vtexInfo.account}`;
    if (vtexInfo.workspace) {
      message += `\nWorkspace: ${vtexInfo.workspace}`;
    }
    vscode.window.showInformationMessage(message);
  } else {
    vscode.window.showWarningMessage("No hay cuenta VTEX activa");
  }
}
