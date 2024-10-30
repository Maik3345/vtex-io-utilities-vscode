import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function getWebviewContent(
  context: vscode.ExtensionContext,
  graph: string | null,
  selectedFolders?: string[]
): string {
  if (!graph || graph === "") {
    return `<h1>No dependencies found</h1>
    <h2>To visualize the dependency diagram:</h2>
    <ul>
    <li>Make sure you have a <code>manifest.json</code> file from VTEX in your project.</li>
    <li>Select more than two projects to generate the diagram.</li>
    <li>Ensure that the selected projects actually depend on each other. If no dependencies exist between the selected projects, the diagram will not be generated.</li>

    <h2>Selected Folders:</h2>
    <ul>
      ${selectedFolders?.map((folder) => `<li>${folder}</li>`).join("")}
    </ul>

    </ul>`;
  }

  const htmlPath = path.join(context.extensionPath, "dist", "diagram.html");
  let htmlContent = fs.readFileSync(htmlPath, "utf8");
  htmlContent = htmlContent.replace(
    '<textarea id="code" rows="10" cols="50"></textarea>',
    `<textarea id="code" rows="10" cols="50">${graph}</textarea>`
  );
  return htmlContent;
}
