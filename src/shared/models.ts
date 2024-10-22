export interface ManifestContent {
  dependencies: { [key: string]: string };
  vendor: string;
  name: string;
}

export interface GraphTree {
  graph: string;
  numberOfDependencies: number;
}
