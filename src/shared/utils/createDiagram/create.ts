import * as vscode from "vscode";
import { readWorkspaceFolders } from "../workspace";
import { getWebviewContent } from "./render";

export async function createDiagram(
  context: vscode.ExtensionContext,
  contextPaths?: string[]
) {
  let graphDirection = "TB";
  const graph = await readWorkspaceFolders(graphDirection, contextPaths);

  const panel = vscode.window.createWebviewPanel(
    "diagramWebview",
    "Create Diagram",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent(context, graph, contextPaths);
}
