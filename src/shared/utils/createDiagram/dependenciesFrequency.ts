import { GraphTree } from "../../models";

export const sortDependenciesByFrequency = (graph: GraphTree[]): string => {
  return graph
    .sort((a, b) => b.numberOfDependencies - a.numberOfDependencies)
    .map((graph) => graph.graph)
    .join("");
};
