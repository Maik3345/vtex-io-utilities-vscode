import * as vscode from 'vscode';
import { Logger } from '../shared';

// Variable global para el elemento de la barra de estado
let statusBarItem: vscode.StatusBarItem | undefined;

/**
 * Crea o recupera el elemento de la barra de estado.
 * Esta es la función central que maneja la creación y visualización del elemento "Hola mundo".
 * @returns El elemento de la barra de estado
 */
export function getStatusBar(): vscode.StatusBarItem {
  Logger.info("Solicitando elemento de barra de estado 'Hola mundo'");
  
  // Crear el elemento de la barra de estado si no existe
  if (!statusBarItem) {
    Logger.info("Creando nuevo elemento de barra de estado 'Hola mundo'");
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "Hola mundo";
    statusBarItem.tooltip = "Este es un elemento de la barra de estado";
    statusBarItem.command = 'vtex-io-utilities-vscode.clickStatusBar';
  } else {
    Logger.info("Usando elemento de barra de estado 'Hola mundo' existente");
  }
  
  // Mostrar el elemento en la barra de estado
  statusBarItem.show();
  Logger.info("Elemento de barra de estado 'Hola mundo' mostrado");
  
  return statusBarItem;
}

/**
 * Maneja el evento de clic en el elemento de la barra de estado.
 */
export function handleStatusBarClick(): void {
  vscode.window.showInformationMessage('¡Has hecho clic en "Hola mundo"!');
}
