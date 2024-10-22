import * as vscode from "vscode";
import { createDiagram } from "./shared";

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
}

function registerCommands(context: vscode.ExtensionContext) {
  // Registrar el comando para la paleta de comandos
  let disposable = vscode.commands.registerCommand(
    "vtex-io-utilities-vscode.createDiagram",
    async () => {
      await createDiagram(context);
    }
  );

  // Registrar el comando para el menú contextual
  let disposableContext = vscode.commands.registerCommand(
    "vtex-io-utilities-vscode.createDiagramFromContext",
    async (uri: vscode.Uri, uris: vscode.Uri[]) => {
      const paths = uris.length ? uris.map((u) => u.fsPath) : [uri.fsPath];
      await createDiagram(context, paths);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableContext);
}
