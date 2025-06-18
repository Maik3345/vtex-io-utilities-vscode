import * as vscode from 'vscode';
import { Logger } from '../shared';

// Define a static variable to hold the status bar item
let statusBarItem: vscode.StatusBarItem | undefined;

export function showStatusBarCommand() {
  // Log that we're trying to show the status bar item
  Logger.info("Mostrando el elemento 'Hola mundo' en la barra de estado");
  
  // Create a status bar item only if it doesn't exist yet
  if (!statusBarItem) {
    Logger.info("Creando nuevo elemento de barra de estado");
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "Hola mundo";
    statusBarItem.tooltip = "Este es un elemento de la barra de estado";
    statusBarItem.command = 'vtex-io-utilities-vscode.clickStatusBar';
  } else {
    Logger.info("Usando elemento de barra de estado existente");
  }
  
  // Show the status bar item
  statusBarItem.show();
  Logger.info("Elemento de barra de estado mostrado");
  
  // Return the status bar item reference for disposal later
  return statusBarItem;
}

export function handleStatusBarClick() {
  vscode.window.showInformationMessage('¡Has hecho clic en "Hola mundo"!');
}
