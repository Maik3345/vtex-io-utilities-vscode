import { GraphTree } from "../../models";
import { processFolders, readWorkspaceFolders } from "../workspace";
import { sortDependenciesByFrequency } from "./dependenciesFrequency";
import { getTreeDependencies } from "./dependenciesTree";

export const createGraph = async (
  graphDirection: string,
  contextPaths?: string[]
) => {
  let graphStart = `flowchart ${graphDirection}\n`;
  let graphContent: GraphTree[] = [];

  const { foldersToRead, manifestContent } = await readWorkspaceFolders(
    contextPaths
  );

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
};
