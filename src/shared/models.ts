export interface ManifestContent {
  dependencies: { [key: string]: string };
  vendor: string;
  version: string;
  name: string;
}

export interface GraphTree {
  graph: string;
  numberOfDependencies: number;
}
