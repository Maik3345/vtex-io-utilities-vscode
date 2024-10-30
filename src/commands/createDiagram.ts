import * as vscode from "vscode";
import { createGraph } from "../shared";
import { getWebviewContent } from "../shared/utils/createDiagram/render";

export async function createDiagram(
  context: vscode.ExtensionContext,
  contextPaths?: string[]
) {
  let graphDirection = "TB";
  const graph = await createGraph(graphDirection, contextPaths);

  const panel = vscode.window.createWebviewPanel(
    "diagramWebview",
    "VTEX IO Diagram",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getWebviewContent(context, graph, contextPaths);
}
