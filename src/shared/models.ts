export interface ManifestContent {
  dependencies: { [key: string]: string };
  vendor: string;
  name: string;
}

export interface GraphThree {
  graph: string;
  numberOfDependencies: number;
}
