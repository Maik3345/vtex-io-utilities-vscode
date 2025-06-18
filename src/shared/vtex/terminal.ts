import * as vscode from "vscode";
import { Logger } from "../helpers/logger";
import { updateVtexStatusBar } from "./statusBar";

/**
 * Executes a VTEX command silently (without showing a terminal) and returns the output
 * This is a generic method to handle various VTEX commands that need to run silently
 * @param command The VTEX command to execute
 * @param updateStatusBar Whether to update the status bar after execution (default: true)
 * @param showProgress Whether to show a progress notification during execution (default: false)
 * @returns A promise that resolves with the command output
 */
export async function executeVtexCommandSilently(
  command: string,
  updateStatusBar: boolean = true,
  showProgress: boolean = false
): Promise<string> {
  Logger.info(`Executing VTEX command silently: ${command}`);

  let progressResolve: (() => void) | undefined;
  let progressPromise: Promise<void> | undefined;

  if (showProgress) {
    // Create a progress notification if requested
    progressPromise = new Promise<void>((resolve) => {
      progressResolve = resolve;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Running VTEX command...`,
          cancellable: true,
        },
        async () => {
          // This promise completes when progressResolve is called
          return new Promise<void>((innerResolve) => {
            // Store the original resolve function so we can call it later
            progressResolve = () => {
              innerResolve();
              resolve();
            };
          });
        }
      );
    });
  }

  try {
    // Execute command and capture output using child_process
    const result = await new Promise<string>((resolve, reject) => {
      const exec = require("child_process").exec;
      exec(
        command,
        { maxBuffer: 1024 * 1024 },
        (error: any, stdout: string, stderr: string) => {
          if (error) {
            Logger.error(`Error executing command: ${error}`);
            Logger.error(`Command stderr: ${stderr}`);
            // Don't reject here, resolve with stderr to handle errors gracefully
            resolve(stderr);
          } else {
            Logger.info(
              `Command executed successfully, output length: ${
                stdout?.length || 0
              }`
            );
            resolve(stdout);
          }
        }
      );
    });

    // If requested, update the status bar after command completes
    if (updateStatusBar) {
      updateVtexStatusBar();
    }

    // Resolve the progress indicator if one was created
    if (progressResolve) {
      progressResolve();
    }

    return result;
  } catch (error) {
    Logger.error(`Exception executing VTEX command silently: ${error}`);

    // Resolve the progress indicator if one was created
    if (progressResolve) {
      progressResolve();
    }

    throw error;
  }
}

/**
 * Executes a command in a terminal and updates the status bar after completion
 * @param command The command to execute
 * @param terminalName The name for the terminal window
 * @param updateStatusBar Whether to update the status bar after execution (default: true)
 * @param captureOutput Whether to capture and return the output (default: false)
 * @param forceNewTerminal Whether to force the creation of a new terminal (default: false)
 * @returns A promise that resolves with the command output if captureOutput is true, otherwise void
 */
export async function executeCommandInTerminal(
  command: string,
  terminalName: string = "Vtex IO",
  updateStatusBar: boolean = true,
  captureOutput: boolean = false,
  forceNewTerminal: boolean = false
): Promise<string | void> {
  try {
    let terminal: vscode.Terminal;

    if (captureOutput) {
      // Use child_process to execute the command and capture output
      Logger.info(`Executing command with output capture: ${command}`);

      return new Promise((resolve, reject) => {
        const exec = require("child_process").exec;
        exec(
          command,
          { maxBuffer: 1024 * 1024 },
          (error: any, stdout: string, stderr: string) => {
            if (error) {
              Logger.error(`Error executing command: ${error}`);
              Logger.error(`Command stderr: ${stderr}`);
              // We don't reject here because we still want to return any output
            }
            Logger.info(
              `Command stdout captured, length: ${stdout?.length || 0}`
            );

            // If requested, update the status bar after command completes
            if (updateStatusBar) {
              updateVtexStatusBar();
            }

            resolve(stdout || stderr);
          }
        );
      });
    } else {
      // Regular terminal execution (without capturing output)
      if (forceNewTerminal) {
        // Force creation of a new terminal
        Logger.info(`Creating new terminal (forced): ${terminalName}`);

        // If a terminal with this name already exists, dispose it first
        const existingTerminals = vscode.window.terminals;
        const existingTerminal = existingTerminals.find(
          (t) => t.name === terminalName
        );
        if (existingTerminal) {
          existingTerminal.dispose();
        }

        // Create a new terminal
        terminal = vscode.window.createTerminal(terminalName);
      } else {
        // Find existing terminal or create a new one
        const existingTerminals = vscode.window.terminals;
        terminal =
          existingTerminals.find((t) => t.name === terminalName) ||
          vscode.window.createTerminal(terminalName);
      }

      // Show the terminal
      terminal.show(true);

      // Estrategia para limpiar la línea actual y ejecutar un comando nuevo
      Logger.info(`Executing command in terminal: ${command}`);

      // Secuencia 3: Ahora ejecutamos nuestro comando en una línea limpia
      terminal.sendText(command, true);

      // If requested, set a timer to update the status after command completes
      if (updateStatusBar) {
        setTimeout(() => {
          // Update the status bar with new information
          updateVtexStatusBar();
        }, 2000);
      }
    }
  } catch (error) {
    Logger.error(`Error executing command in terminal: ${error}`);
    vscode.window.showErrorMessage(`Error executing command: ${error}`);
    throw error; // Re-throw to allow caller to handle specific errors
  }
}
