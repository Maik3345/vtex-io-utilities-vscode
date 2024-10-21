import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ManifestContent {
  dependencies: { [key: string]: string };
  vendor: string;
  name: string;
}

interface GraphThree {
  graph: string;
  numberOfDependencies: number;
}

/**
 * Get the three dependencies of a manifest.json file
 * @param manifestData
 * @param manifestContent
 * @returns
 */
const getThreeDependencies = (
  manifestData: ManifestContent,
  manifestContent: ManifestContent[]
) => {
  if (!manifestData.dependencies) {
    return null;
  }
  let graph = "";
  let numberOfDependencies = 0;
  const appName = manifestData.vendor + "." + manifestData.name;
  const dependencies = manifestData.dependencies;
  Object.keys(dependencies).forEach((dep) => {
    // if the dependency is not in the manifestContent, skip it, only show dependencies that are in the current directory
    if (
      !manifestContent.find(
        (manifest) => `${manifest.vendor}.${manifest.name}` === dep
      )
    ) {
      return;
    }

    numberOfDependencies++;
    graph += `${appName} --> ${dep}\n`;
  });
  return {
    graph,
    numberOfDependencies,
  };
};

function sortDependenciesByFrequency(graph: GraphThree[]): string {
  return graph
    .sort((a, b) => b.numberOfDependencies - a.numberOfDependencies)
    .map((graph) => graph.graph)
    .join("");
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "vtex-io-utilities-vscode.createDiagram",
    async () => {
      let graphDirection = "TB";
      // Read the current directory and list manifest.json files
      const graph = await readWorkspaceFolders(graphDirection);

      const panel = vscode.window.createWebviewPanel(
        "diagramWebview",
        "Create Diagram",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent(context, graph);

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "GraphDirectionLeftToRight":
              graphDirection = "LR";
              return;

            case "GraphDirectionTopToBottom":
              graphDirection = "TB";
              return;
            default:
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function readWorkspaceFolders(graphDirection: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  let graphStart = `flowchart ${graphDirection}\n`;
  let graphContent: GraphThree[] = [];
  let manifestContent: {
    dependencies: { [key: string]: string };
    vendor: string;
    name: string;
  }[] = [];
  if (workspaceFolders) {
    const promises = workspaceFolders.map(async (folder) => {
      const filePath = folder.uri.fsPath;
      if (fs.lstatSync(filePath).isDirectory()) {
        const manifestPath = path.join(filePath, "manifest.json");
        if (fs.existsSync(manifestPath)) {
          try {
            const data = await fs.promises.readFile(manifestPath, "utf8");
            manifestContent.push(JSON.parse(data));
          } catch (err) {
            console.error("Error reading manifest.json:", err);
          }
        }
      }
    });

    await Promise.all(promises)
      .then(() => {})
      .catch((err) => {
        console.error("Error processing manifest.json files:", err);
      });

    manifestContent.forEach((manifestData) => {
      const dependenciesList = getThreeDependencies(
        manifestData,
        manifestContent
      );
      if (dependenciesList) {
        graphContent.push(dependenciesList);
      }
    });
  }

  if (!graphContent.length) {
    return `flowchart LR
    id1((No dependencies found, please add a manifest.json file in the root of your workspace))`;
  }

  const content = `${graphStart}${sortDependenciesByFrequency(graphContent)}`;
  return content;
}

function getWebviewContent(
  context: vscode.ExtensionContext,
  graph: string
): string {
  const htmlPath = path.join(context.extensionPath, "src", "diagram.html");
  let htmlContent = fs.readFileSync(htmlPath, "utf8");
  htmlContent = htmlContent.replace(
    '<textarea id="code" rows="10" cols="50"></textarea>',
    `<textarea id="code" rows="10" cols="50">${graph}</textarea>`
  );
  return htmlContent;
}

export function deactivate() {}
