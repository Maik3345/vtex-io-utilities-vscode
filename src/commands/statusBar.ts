import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "../shared";

// Variable global para el elemento de la barra de estado
let statusBarItem: vscode.StatusBarItem | undefined;

// Rutas a los archivos de configuración VTEX
const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
const SESSION_FILE_PATH = path.join(VTEX_SESSION_DIR, "session.json");
const WORKSPACE_FILE_PATH = path.join(VTEX_SESSION_DIR, "workspace.json");
const TOKENS_FILE_PATH = path.join(VTEX_SESSION_DIR, "tokens.json");

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
      "statusBarItem.debugBackground"
    );
  } else {
    // Sin workspace: color neutro
    statusBarItem.backgroundColor = undefined;
  }

  // Obtener el icono adecuado según el contexto usando nuestra clase IconManager

  // Formatear el texto para la barra de estado con el icono correspondiente
  let displayText = `$(vtex-logo) ${vtexInfo.account}`;
  if (vtexInfo.workspace) {
    displayText = `$(vtex-logo) ${vtexInfo.account} - ${vtexInfo.workspace}`;
  }

  // Formatear el texto para el tooltip
  let tooltipText = `Active VTEX account: ${vtexInfo.account}`;
  if (vtexInfo.workspace) {
    tooltipText = `Active VTEX account: ${vtexInfo.account}\nWorkspace: ${vtexInfo.workspace}`;
  }
  tooltipText += "\n\nClick to switch accounts";

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
 * Obtiene todas las cuentas VTEX disponibles del archivo tokens.json
 * @returns Array con los nombres de las cuentas disponibles
 */
function getAvailableVtexAccounts(): string[] {
  try {
    Logger.info(`Intentando leer archivo de tokens: ${TOKENS_FILE_PATH}`);

    // Verificar si el archivo existe
    if (!fs.existsSync(TOKENS_FILE_PATH)) {
      Logger.info("El archivo tokens.json no existe");
      return [];
    }

    // Leer y parsear el archivo
    const tokensContent = fs.readFileSync(TOKENS_FILE_PATH, "utf-8");
    const tokensData = JSON.parse(tokensContent);

    // Obtener las claves del objeto que representan las cuentas
    const accounts = Object.keys(tokensData);

    if (accounts.length === 0) {
      Logger.info("No se encontraron cuentas en tokens.json");
    } else {
      Logger.info(
        `Se encontraron ${accounts.length} cuentas: ${accounts.join(", ")}`
      );
    }

    return accounts;
  } catch (error) {
    Logger.error(`Error al leer el archivo de tokens VTEX: ${error}`);
    return [];
  }
}

/**
 * Maneja el evento de clic en el elemento de la barra de estado.
 * Muestra un menú contextual con las cuentas disponibles y opciones adicionales.
 */
export async function handleStatusBarClick(): Promise<void> {
  const vtexInfo = getVtexInfo();

  // Obtener todas las cuentas disponibles
  const availableAccounts = getAvailableVtexAccounts();

  // Crear arrays separados para cada tipo de opción
  const accountOptions: string[] = [];

  // Agregar las cuentas disponibles
  availableAccounts.forEach((account) => {
    // Marcar la cuenta activa con un check
    const isActive = account === vtexInfo.account;
    const icon = isActive ? "$(check)" : "$(account)";
    accountOptions.push(`${icon} ${account} ${isActive ? "(current)" : ""}`);
  });

  // Pone de primero la cuenta activa
  accountOptions.sort((a, b) => {
    if (a.startsWith("$(check)")) return -1; // La cuenta activa va primero
    if (b.startsWith("$(check)")) return 1; // La cuenta activa va primero
    return a.localeCompare(b); // Ordenar alfabéticamente el resto
  });

  // Mostrar el menú QuickPick usando async/await
  const selection = await vscode.window.showQuickPick(accountOptions, {
    placeHolder: "Choose a VTEX account",
    matchOnDescription: true,
    matchOnDetail: true,
    title: "VTEX Accounts",
  });

  // Manejar la selección
  if (selection) {
    // Verificar si es una cuenta o una acción
    if (
      selection.startsWith("$(check)") ||
      selection.startsWith("$(account)")
    ) {
      // Es una cuenta - extraer el nombre de la cuenta
      const accountName = selection
        .replace("$(check) ", "")
        .replace("$(account) ", "");

      try {
        // Crear un nuevo terminal o usar uno existente
        const terminal = vscode.window.createTerminal("VTEX Switch Account");

        // Mostrar el terminal
        terminal.show(true);

        // Ejecutar el comando de cambio de cuenta
        const switchCommand = `vtex switch ${accountName}`;
        terminal.sendText(switchCommand);

        // Configurar un temporizador para actualizar el estado después de un tiempo
        // para dar tiempo a que el comando se complete
        setTimeout(() => {
          // Actualizar la barra de estado con la nueva información
          getStatusBar();
        }, 2000);
      } catch (error) {
        Logger.error(`Error al ejecutar el comando switch: ${error}`);
        vscode.window.showErrorMessage(`Error al cambiar de cuenta: ${error}`);
      }
    }
  }
}
