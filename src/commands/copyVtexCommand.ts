import * as vscode from "vscode";
import { getAppsCommand } from "../shared";

export async function copyVtexCommand(
  command: string,
  contextPaths?: string[]
) {
  getAppsCommand(command, contextPaths);
}
