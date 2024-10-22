import { ManifestContent } from "../../models";

/**
 * Get the tree dependencies of a manifest.json file
 * @param manifestData
 * @param manifestContent
 * @returns
 */
export const getTreeDependencies = (
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
