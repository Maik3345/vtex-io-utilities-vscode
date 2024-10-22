import { GraphThree } from "../../models";

export const sortDependenciesByFrequency = (graph: GraphThree[]): string => {
  return graph
    .sort((a, b) => b.numberOfDependencies - a.numberOfDependencies)
    .map((graph) => graph.graph)
    .join("");
};
