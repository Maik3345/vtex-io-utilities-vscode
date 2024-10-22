import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { GraphTree, ManifestContent } from "../../models";
import {
  getTreeDependencies,
  sortDependenciesByFrequency,
} from "../createDiagram";

export async function readWorkspaceFolders(
  graphDirection: string,
  contextPaths?: string[]
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  let graphStart = `flowchart ${graphDirection}\n`;
  let graphContent: GraphTree[] = [];
  let manifestContent: ManifestContent[] = [];

  let foldersToRead: string[] = [];

  // Check if contextPaths are provided and not empty
  if (contextPaths && contextPaths.length > 0) {
    // Get folders to read from the provided context paths
    foldersToRead = await getFoldersToReadFromContextPaths(contextPaths);
  }
  // If multiple workspace folders or none, read all workspace folders
  else {
    foldersToRead = workspaceFolders?.map((folder) => folder.uri.fsPath) || [];
  }

  if (foldersToRead.length) {
    await processFolders(foldersToRead, manifestContent);
    manifestContent.forEach((manifestData) => {
      const dependenciesList = getTreeDependencies(
        manifestData,
        manifestContent
      );
      if (dependenciesList) {
        graphContent.push(dependenciesList);
      }
    });
  }

  if (!graphContent.length) {
    return null;
  }

  const sortedGraph = sortDependenciesByFrequency(graphContent);

  if (sortedGraph == "") {
    return null;
  }

  const content = `${graphStart}${sortedGraph}`;
  return content;
}

async function getFoldersToReadFromContextPaths(
  contextPaths: string[]
): Promise<string[]> {
  if (contextPaths.length === 1) {
    const manifestPath = path.join(contextPaths[0], "manifest.json");
    if (fs.existsSync(manifestPath)) {
      return contextPaths;
    } else {
      const folderPath = contextPaths[0];
      const files = await fs.promises.readdir(folderPath);
      return files
        .map((file) => path.join(folderPath, file))
        .filter((filePath) => fs.lstatSync(filePath).isDirectory());
    }
  } else {
    return contextPaths;
  }
}

async function processFolders(
  foldersToRead: string[],
  manifestContent: ManifestContent[]
) {
  const promises = foldersToRead.map(async (filePath) => {
    if (fs.lstatSync(filePath).isDirectory()) {
      const manifestPath = path.join(filePath, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        await readManifestFile(manifestPath, manifestContent);
      } else {
        await searchInSubdirectories(filePath, manifestContent);
      }
    }
  });

  await Promise.all(promises).catch((err) => {
    console.error("Error processing manifest.json files:", err);
  });
}

async function readManifestFile(
  manifestPath: string,
  manifestContent: ManifestContent[]
) {
  try {
    const data = await fs.promises.readFile(manifestPath, "utf8");
    manifestContent.push(JSON.parse(data));
  } catch (err) {
    console.error("Error reading manifest.json:", err);
  }
}

async function searchInSubdirectories(
  directoryPath: string,
  manifestContent: ManifestContent[]
) {
  try {
    const files = await fs.promises.readdir(directoryPath);
    const subdirectoryPromises = files.map(async (file) => {
      const subdirectoryPath = path.join(directoryPath, file);
      if (fs.lstatSync(subdirectoryPath).isDirectory()) {
        const manifestPath = path.join(subdirectoryPath, "manifest.json");
        if (fs.existsSync(manifestPath)) {
          await readManifestFile(manifestPath, manifestContent);
        }
      }
    });
    await Promise.all(subdirectoryPromises);
  } catch (err) {
    console.error("Error searching in subdirectories:", err);
  }
}
