import * as vscode from 'vscode';
import { Logger } from './shared';

// Variable global para el elemento de la barra de estado
let statusBarItem: vscode.StatusBarItem;

// Función para crear y mostrar el elemento de la barra de estado
export function createStatusBar(): vscode.StatusBarItem {
  Logger.info("Creando elemento de barra de estado 'Hola mundo'");
  
  // Crear el elemento de la barra de estado
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "Hola mundo";
  statusBarItem.tooltip = "Este es un elemento de la barra de estado";
  statusBarItem.command = 'vtex-io-utilities-vscode.clickStatusBar';
  
  // Mostrar el elemento en la barra de estado
  statusBarItem.show();
  Logger.info("Elemento de barra de estado 'Hola mundo' mostrado");
  
  return statusBarItem;
}
