import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "../shared";

// Global variables for status bar elements
let statusBarItem: vscode.StatusBarItem | undefined;
let workspaceStatusBarItem: vscode.StatusBarItem | undefined;

// Paths to VTEX configuration files
const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
const SESSION_FILE_PATH = path.join(VTEX_SESSION_DIR, "session.json");
const WORKSPACE_FILE_PATH = path.join(VTEX_SESSION_DIR, "workspace.json");
const TOKENS_FILE_PATH = path.join(VTEX_SESSION_DIR, "tokens.json");

/**
 * Interface for complete VTEX information
 */
interface VtexInfo {
  account?: string;
  workspace?: string;
}

/**
 * Reads the session.json file and gets the VTEX account name
 * @returns The account name or undefined if the file doesn't exist or doesn't have the account field
 */
function getVtexAccount(): string | undefined {
  try {
    Logger.info(`Attempting to read session file: ${SESSION_FILE_PATH}`);

    // Check if the file exists
    if (!fs.existsSync(SESSION_FILE_PATH)) {
      Logger.info("session.json file doesn't exist");
      return undefined;
    }

    // Read and parse the file
    const sessionContent = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
    const sessionData = JSON.parse(sessionContent); // Check if it has the account field
    if (!sessionData.account) {
      Logger.info("session.json file doesn't contain the account field");
      return undefined;
    }

    Logger.info(`VTEX account found: ${sessionData.account}`);
    return sessionData.account;
  } catch (error) {
    Logger.error(`Error reading VTEX session file: ${error}`);
    return undefined;
  }
}

/**
 * Reads the workspace.json file and gets the current workspace
 * @returns The workspace name or undefined if the file doesn't exist or doesn't have the currentWorkspace field
 */
function getVtexWorkspace(): string | undefined {
  try {
    Logger.info(`Attempting to read workspace file: ${WORKSPACE_FILE_PATH}`);

    // Check if the file exists
    if (!fs.existsSync(WORKSPACE_FILE_PATH)) {
      Logger.info("workspace.json file doesn't exist");
      return undefined;
    }

    // Read and parse the file
    const workspaceContent = fs.readFileSync(WORKSPACE_FILE_PATH, "utf-8");
    const workspaceData = JSON.parse(workspaceContent); // Check if it has the currentWorkspace field
    if (!workspaceData.currentWorkspace) {
      Logger.info(
        "workspace.json file doesn't contain the currentWorkspace field"
      );
      return undefined;
    }

    Logger.info(`VTEX workspace found: ${workspaceData.currentWorkspace}`);
    return workspaceData.currentWorkspace;
  } catch (error) {
    Logger.error(`Error reading VTEX workspace file: ${error}`);
    return undefined;
  }
}

/**
 * Gets the complete VTEX information (account and workspace)
 * @returns Object with account and workspace information
 */
function getVtexInfo(): VtexInfo {
  const account = getVtexAccount();
  const workspace = getVtexWorkspace();

  return { account, workspace };
}

/**
 * Creates or retrieves the status bar element.
 * Reads the session.json and workspace.json files to display VTEX information.
 * @returns The status bar element or undefined if there is no VTEX account
 */
export function getStatusBar(): vscode.StatusBarItem | undefined {
  Logger.info("Requesting status bar item for VTEX");

  // Get VTEX information
  const vtexInfo = getVtexInfo();

  // If there's no account, hide everything and return undefined
  if (!vtexInfo.account) {
    if (statusBarItem) {
      statusBarItem.hide();
      Logger.info("Hiding status bar because there is no active VTEX account");
    }
    return undefined;
  }

  // Create the status bar element if it doesn't exist
  if (!statusBarItem) {
    Logger.info("Creating new status bar element for VTEX");
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      110
    );
    statusBarItem.command = "vtex-io-utilities-vscode.clickStatusBar";
  }

  statusBarItem.backgroundColor = new vscode.ThemeColor(
    "statusBarItem.background"
  );

  // Format the text for the status bar with the corresponding icon
  // Remove extra spaces between icon and text
  let displayText = `$(vtex-logo)${vtexInfo.account}`;

  // Format the text for the tooltip
  let tooltipText = `Active VTEX account: ${vtexInfo.account}`;
  if (vtexInfo.workspace) {
    tooltipText = `Active VTEX account: ${vtexInfo.account}\nWorkspace: ${vtexInfo.workspace}`;
  }
  tooltipText += "\n\nClick to switch accounts";

  // Update text and tooltip
  statusBarItem.text = displayText;
  statusBarItem.tooltip = tooltipText;

  // Apply compact configuration
  configureCompactStatusBarItem(statusBarItem);

  // Show the element in the status bar
  statusBarItem.show();
  Logger.info(`Status bar element for VTEX '${displayText}' displayed`);

  // Also show workspace status bar
  getWorkspaceStatusBar();

  return statusBarItem;
}

/**
 * Gets all available VTEX accounts from the tokens.json file
 * @returns Array with the names of available accounts
 */
function getAvailableVtexAccounts(): string[] {
  try {
    Logger.info(`Attempting to read tokens file: ${TOKENS_FILE_PATH}`);

    // Check if the file exists
    if (!fs.existsSync(TOKENS_FILE_PATH)) {
      Logger.info("tokens.json file doesn't exist");
      return [];
    }

    // Read and parse the file
    const tokensContent = fs.readFileSync(TOKENS_FILE_PATH, "utf-8");
    const tokensData = JSON.parse(tokensContent);

    // Get the keys of the object that represent accounts
    const accounts = Object.keys(tokensData);

    if (accounts.length === 0) {
      Logger.info("No accounts found in tokens.json");
    } else {
      Logger.info(`Found ${accounts.length} accounts: ${accounts.join(", ")}`);
    }

    return accounts;
  } catch (error) {
    Logger.error(`Error reading VTEX tokens file: ${error}`);
    return [];
  }
}

/**
 * Handles the click event on the status bar element.
 * Shows a context menu with available accounts and additional options.
 */
export async function handleStatusBarClick(): Promise<void> {
  const vtexInfo = getVtexInfo();

  // Get all available accounts
  const availableAccounts = getAvailableVtexAccounts();

  // Create separate arrays for each option type
  const accountOptions: string[] = [];
  const actions: string[] = ["List account information"];

  // Add available accounts
  availableAccounts.forEach((account) => {
    // Mark the active account with a check
    const isActive = account === vtexInfo.account;
    const icon = isActive ? "$(check)" : "$(account)";
    accountOptions.push(`${icon} ${account} ${isActive ? "(current)" : ""}`);
  });

  // Put the active account first
  accountOptions.sort((a, b) => {
    if (a.startsWith("$(check)")) return -1; // Active account goes first
    if (b.startsWith("$(check)")) return 1; // Active account goes first
    return a.localeCompare(b); // Sort the rest alphabetically
  });

  const allOptions: string[] = [...accountOptions, "---", ...actions];

  // Show the QuickPick menu using async/await
  const selection = await vscode.window.showQuickPick(allOptions, {
    placeHolder: "Select a VTEX account or action",
    matchOnDescription: true,
    matchOnDetail: true,
    title: "VTEX Account Switcher and Actions",
  });

  // Handle the selection
  if (selection) {
    // Check if it's an account or an action
    if (
      selection.startsWith("$(check)") ||
      selection.startsWith("$(account)")
    ) {
      // It's an account - extract the account name
      const accountName = selection
        .replace("$(check) ", "")
        .replace("$(account) ", "")
        .replace(" (current)", "");

      try {
        const command = `vtex switch ${accountName}`;
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Running: ${command}`,
            cancellable: false,
          },
          async () => {
            // Show progress notification during account switching
            // Execute the account switch command silently using our new generic method

            const output = await executeVtexCommandSilently(
              command,
              true,
              false
            );

            if (
              output.toLowerCase().includes("error") ||
              output.toLowerCase().includes("failed")
            ) {
              Logger.error(
                `Error switching to account ${accountName}: ${output}`
              );
              vscode.window.showErrorMessage(
                `Failed to switch to account ${accountName}: ${output.trim()}`
              );
              throw new Error(output.trim());
            }
          }
        );
      } catch (error) {
        Logger.error(`Error executing switch command: ${error}`);
        vscode.window.showErrorMessage(`Error switching accounts: ${error}`);
      }
    } else if (selection === "List account information") {
      const command = "vtex ls";
      try {
        // Use our centralized method to execute the command, but in visible terminal
        // since this is informational and the user likely wants to see the full output
        await executeCommandInTerminal(command);
      } catch (error) {
        Logger.error(`Error executing list command: ${error}`);
        vscode.window.showErrorMessage(`Error listing accounts: ${error}`);
      }
    } else {
      // It's a separator or an unrecognized option
      Logger.info(`Unrecognized selection: ${selection}`);
    }
  }
}

/**
 * Creates or retrieves the reload element for the status bar.
 * @returns The status bar element to reload VTEX information
 */
// Reload functions removed

/**
 * Executes a command in a terminal and updates the status bar after completion
 * @param command The command to execute
 * @param terminalName The name for the terminal window
 * @param updateStatusBar Whether to update the status bar after execution (default: true)
 * @param captureOutput Whether to capture and return the output (default: false)
 * @param forceNewTerminal Whether to force the creation of a new terminal (default: false)
 * @returns A promise that resolves with the command output if captureOutput is true, otherwise void
 */
async function executeCommandInTerminal(
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
              getStatusBar();
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

        // Create a new clean terminal
        terminal = vscode.window.createTerminal(terminalName);
      } else {
        // Check if a terminal with the specified name already exists
        const existingTerminals = vscode.window.terminals;
        const existingTerminal = existingTerminals.find(
          (t) => t.name === terminalName
        );

        if (existingTerminal) {
          // Use the existing terminal
          Logger.info(`Reusing existing terminal: ${terminalName}`);
          terminal = existingTerminal;
        } else {
          // Create a new terminal if none exists with that name
          Logger.info(`Creating new terminal: ${terminalName}`);
          terminal = vscode.window.createTerminal(terminalName);
        }
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
          getStatusBar();
        }, 2000);
      }
    }
  } catch (error) {
    Logger.error(`Error executing command in terminal: ${error}`);
    vscode.window.showErrorMessage(`Error executing command: ${error}`);
    throw error; // Re-throw to allow caller to handle specific errors
  }
}

/**
 * Executes a VTEX command silently (without showing a terminal) and returns the output
 * This is a generic method to handle various VTEX commands that need to run silently
 * @param command The VTEX command to execute
 * @param updateStatusBar Whether to update the status bar after execution (default: true)
 * @param showProgress Whether to show a progress notification during execution (default: false)
 * @returns A promise that resolves with the command output
 */
async function executeVtexCommandSilently(
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
          title: `Running: ${command}`,
          cancellable: false,
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
      getStatusBar();
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
 * Parses the output of "vtex workspace list" command to extract available workspaces
 * @param output The command output string
 * @returns An array of workspace objects with name, isActive, isProduction properties
 */
function parseWorkspaceListOutput(
  output: string
): Array<{ name: string; isActive: boolean; isProduction: boolean }> {
  const workspaces: Array<{
    name: string;
    isActive: boolean;
    isProduction: boolean;
  }> = [];

  // Log the output for debugging
  Logger.info(`Parsing workspace list output, length: ${output?.length || 0}`);

  if (!output || output.trim() === "") {
    Logger.warning("Empty output from vtex workspace list command");
    return workspaces;
  }

  try {
    // Split the output into lines
    const lines = output.trim().split("\n");

    if (lines.length === 0) {
      Logger.warning("No lines found in output");
      return workspaces;
    }

    Logger.info(`Found ${lines.length} lines in workspace list output`);

    // Find the header line (contains "Name", "Weight", "Production")
    const headerIndex = lines.findIndex(
      (line) =>
        line.includes("Name") &&
        (line.includes("Weight") || line.includes("Production"))
    );

    if (headerIndex === -1) {
      Logger.warning(
        "Header line not found in output, trying alternative parsing"
      );

      // Try a more flexible approach if no header is found
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (
          !trimmedLine ||
          trimmedLine.startsWith("VTEX") ||
          trimmedLine.includes("error")
        )
          continue;

        // Look for lines that have * followed by a name
        if (trimmedLine.startsWith("*")) {
          const parts = trimmedLine.trim().split(/\s+/);
          if (parts.length >= 2) {
            const name = parts[1];
            const isProduction = parts.some(
              (part) => part.toLowerCase() === "true"
            );

            workspaces.push({
              name,
              isActive: true,
              isProduction,
            });
          }
        }
        // Look for workspace names without the *
        else if (/^[a-zA-Z0-9_-]+\s/.test(trimmedLine)) {
          const parts = trimmedLine.trim().split(/\s+/);
          const name = parts[0];
          const isProduction = parts.some(
            (part) => part.toLowerCase() === "true"
          );

          workspaces.push({
            name,
            isActive: false,
            isProduction,
          });
        }
      }

      if (workspaces.length > 0) {
        Logger.info(
          `Found ${workspaces.length} workspaces using alternative parsing`
        );
      }
      return workspaces;
    }

    Logger.info(`Found header at line ${headerIndex}, processing data lines`);

    // Process data lines after the header
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse each line - format is typically: "* dev    0        false"
      // The columns are: Active indicator + Name, Weight, Production
      const parts = line.trim().split(/\s+/);

      // Check if it has enough parts
      if (parts.length >= 2) {
        let name = "";
        let isActive = false;

        // Check if the first part is an active marker "*"
        if (parts[0] === "*") {
          isActive = true;
          name = parts[1]; // Name is the second part
        } else if (parts[0].startsWith("*")) {
          isActive = true;
          // If the * is attached to the name
          name = parts[0].substring(1).trim();
          if (name === "") {
            name = parts[1]; // If * was alone with no attached name
          }
        } else {
          name = parts[0]; // Name is the first part
        }

        // Get production status from the last part if it looks like a boolean
        const lastPart = parts[parts.length - 1].toLowerCase();
        const isProduction = lastPart === "true";

        workspaces.push({
          name,
          isActive,
          isProduction,
        });
      }
    }

    Logger.info(`Successfully parsed ${workspaces.length} workspaces`);
  } catch (error) {
    Logger.error(`Error parsing workspace list output: ${error}`);
  }

  return workspaces;
}

/**
 * Handles click on the workspace status bar item.
 * Executes "vtex workspace list", parses the output, and shows a QuickPick with workspaces.
 */
export async function handleWorkspaceStatusBarClick(): Promise<void> {
  try {
    Logger.info("Listing available VTEX workspaces...");

    // Define the command to list workspaces
    const command = "vtex workspace list";
    const terminalName = "VTEX Workspace";

    // Get the current workspace for reference
    const currentWorkspace = getVtexWorkspace();

    // Show progress while we're getting workspaces
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running: ${command}`,
        cancellable: false,
      },
      async (progress) => {
        try {
          // Execute the command silently and capture output using our new generic method
          const output = await executeVtexCommandSilently(
            command,
            false // Don't update status bar yet
          );

          progress.report({
            increment: 50,
            message: "Getting available workspaces...",
          });

          // Parse the output to get workspace list
          const workspaces = parseWorkspaceListOutput(output);

          if (workspaces.length === 0) {
            // No workspaces found
            Logger.warning("No workspaces found in the output");

            // Show in terminal as backup and continue with manual options
            await executeCommandInTerminal(command, terminalName, false);

            vscode.window.showInformationMessage(
              "Could not automatically detect workspaces. Please see the terminal output."
            );

            // Show manual options only
            return showWorkspaceOptions(terminalName, currentWorkspace);
          }

          // Create the quick pick items for workspaces
          const workspaceItems = workspaces.map((ws) => ({
            label: `${ws.isActive ? "$(check) " : "$(workspace) "}${ws.name}`,
            description: `${ws.isActive ? "(current)" : ""} ${
              ws.isProduction ? "[Production]" : ""
            }`,
            workspace: ws.name,
            isActive: ws.isActive,
            isProduction: ws.isProduction,
          }));

          // Add separate delete options for each workspace (except master and current)
          const deleteItems = workspaces
            .filter((ws) => ws.name !== "master" && !ws.isActive)
            .map((ws) => ({
              label: `$(trash) Delete ${ws.name}`,
              description: `Delete workspace: ${ws.name}`,
              action: "delete",
              workspace: ws.name,
              isProduction: ws.isProduction,
            }));

          // Add additional options at the end
          const additionalOptions = [
            {
              label: "",
              description: "Separator",
              kind: vscode.QuickPickItemKind.Separator,
            },
            {
              label: "$(plus) Create a new workspace",
              description: "Create and switch to a new VTEX workspace",
              action: "create",
            },
          ];

          // Combine workspace items, delete options, and additional options
          const quickPickItems = [
            ...workspaceItems,
            ...additionalOptions,
            ...(deleteItems.length > 0
              ? [
                  {
                    label: "",
                    description: "Delete Options",
                    kind: vscode.QuickPickItemKind.Separator,
                  },
                  ...deleteItems,
                ]
              : []),
          ];

          progress.report({
            increment: 50,
            message: "OK",
          });

          // Show the QuickPick
          const selection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: "Select a workspace to switch to or create a new one",
            title: `VTEX Workspaces (Current: ${currentWorkspace || "None"})`,
            ignoreFocusOut: true,
          });

          if (!selection) {
            return; // User cancelled
          }

          if ((selection as any).action === "create") {
            // Handle create new workspace
            await createNewWorkspace(terminalName);
          } else if (
            (selection as any).action === "delete" &&
            (selection as any).workspace
          ) {
            // Handle workspace deletion
            const workspaceToDelete = (selection as any).workspace;
            await deleteWorkspace(workspaceToDelete);
          } else if ((selection as any).workspace) {
            // Handle workspace selection (switching)
            const selectedWorkspace = (selection as any).workspace;

            if (selectedWorkspace === currentWorkspace) {
              vscode.window.showInformationMessage(
                `Already using workspace: ${selectedWorkspace}`
              );
              return;
            }

            // Execute the workspace switch command silently
            const switchCommand = `vtex use ${selectedWorkspace}`;
            await executeVtexCommandSilently(switchCommand, true, true);
          }
        } catch (error) {
          // If there's an error, show the command in a terminal as fallback
          Logger.error(`Error: ${error}`);
          await executeCommandInTerminal(command, terminalName, false);

          // Show manual options
          return showWorkspaceOptions(terminalName, currentWorkspace);
        }
      }
    );
  } catch (error) {
    Logger.error(`Error listing VTEX workspaces: ${error}`);
    vscode.window.showErrorMessage(`Error listing workspaces: ${error}`);
  }
}

/**
 * Shows workspace options when workspace list can't be automatically parsed
 * @param terminalName The name of the terminal to use for commands
 * @param currentWorkspace The current workspace name
 */
async function showWorkspaceOptions(
  terminalName: string,
  currentWorkspace?: string
): Promise<void> {
  // Show options in a QuickPick
  const options = [
    {
      label: "$(plus) Create a new workspace",
      description: "Create and switch to a new VTEX workspace",
      detail: "Executes 'vtex use {workspaceName} --create'",
      action: "create",
    },
    {
      label: "$(pencil) Enter workspace name to use",
      description: "Switch to an existing workspace by name",
      detail: "Executes 'vtex use {workspaceName}'",
      action: "use",
    },
  ];

  const selection = await vscode.window.showQuickPick(options, {
    placeHolder: `Current workspace: ${
      currentWorkspace || "None"
    }. See terminal for available workspaces.`,
    title: "VTEX Workspace Actions",
    ignoreFocusOut: true,
  });

  if (selection) {
    if (selection.action === "create") {
      // Create a new workspace
      await createNewWorkspace(terminalName);
    } else if (selection.action === "use") {
      // Switch to an existing workspace
      const workspaceName = await vscode.window.showInputBox({
        prompt: "Enter the name of the workspace to switch to",
        placeHolder: "workspace-name",
        title: "Use VTEX Workspace",
        ignoreFocusOut: true,
      });

      if (workspaceName) {
        // Execute the workspace switch command silently
        const switchCommand = `vtex use ${workspaceName}`;
        await executeVtexCommandSilently(switchCommand, true, true);
      }
    }
  }
}

/**
 * Helper function to create a new workspace
 * @param terminalName The name of the terminal to use for commands
 */
async function createNewWorkspace(terminalName: string): Promise<void> {
  const newWorkspaceName = await vscode.window.showInputBox({
    prompt: "Enter the name for the new workspace",
    placeHolder: "new-workspace-name",
    title: "Create New VTEX Workspace",
    validateInput: (value) => {
      // Validate the workspace name (alphanumeric, dash and underscore)
      return /^[a-z0-9-_]+$/.test(value)
        ? null
        : "Workspace name must contain only lowercase letters, numbers, dash (-) and underscore (_)";
    },
    ignoreFocusOut: true,
  });

  if (newWorkspaceName) {
    // Execute the create workspace command silently
    const createCommand = `vtex use ${newWorkspaceName}`;
    await executeVtexCommandSilently(createCommand, true, true);

    vscode.window.showInformationMessage(
      `Created and switched to workspace: ${newWorkspaceName}`
    );
  }
}

/**
 * Helper function to delete a workspace
 * @param workspaceName The name of the workspace to delete
 * @returns A promise that resolves when the workspace is deleted
 */
async function deleteWorkspace(workspaceName: string): Promise<void> {
  // Can't delete the current workspace or master workspace
  const currentWorkspace = getVtexWorkspace();

  if (workspaceName === "master") {
    vscode.window.showErrorMessage("Cannot delete the master workspace");
    return;
  }

  if (workspaceName === currentWorkspace) {
    vscode.window.showErrorMessage(
      "Cannot delete the current workspace. Switch to another workspace first."
    );
    return;
  }

  try {
    // Execute the delete workspace command silently
    const deleteCommand = `vtex workspace delete ${workspaceName}`;

    // Show progress notification
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running: ${deleteCommand}`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 50 });

        await executeCommandInTerminal(deleteCommand);

        progress.report({ increment: 50 });
      }
    );
  } catch (error) {
    Logger.error(`Error deleting workspace: ${error}`);
    vscode.window.showErrorMessage(`Error deleting workspace: ${error}`);
  }
}

/**
 * Creates or retrieves the workspace status bar element.
 * Shows only the current workspace and allows switching workspaces when clicked.
 * @returns The status bar element for workspace or undefined if there is no VTEX workspace
 */
export function getWorkspaceStatusBar(): vscode.StatusBarItem | undefined {
  Logger.info("Requesting workspace status bar item for VTEX");

  // Get VTEX information
  const vtexInfo = getVtexInfo();

  // If there's no account or workspace, hide the status bar item and return undefined
  if (!vtexInfo.account || !vtexInfo.workspace) {
    if (workspaceStatusBarItem) {
      workspaceStatusBarItem.hide();
      Logger.info(
        "Hiding workspace status bar because there is no active VTEX account or workspace"
      );
    }
    return undefined;
  }

  // Create the workspace status bar element if it doesn't exist
  if (!workspaceStatusBarItem) {
    Logger.info("Creating new workspace status bar element for VTEX");
    workspaceStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      120
    );
    workspaceStatusBarItem.command =
      "vtex-io-utilities-vscode.clickWorkspaceStatusBar";
  }

  // Format the text for the workspace status bar
  // Remove extra spaces between icon and text
  const displayText = `${vtexInfo.workspace}`;

  // Format the tooltip text
  const tooltipText = `Active VTEX workspace: ${vtexInfo.workspace}\n\nClick to switch workspaces`;

  // Update text and tooltip
  workspaceStatusBarItem.text = displayText;
  workspaceStatusBarItem.tooltip = tooltipText;

  // Apply compact configuration
  configureCompactStatusBarItem(workspaceStatusBarItem);

  // Apply color based on workspace type (master/production are usually different)
  if (vtexInfo.workspace === "master") {
    workspaceStatusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  } else {
    workspaceStatusBarItem.backgroundColor = undefined; // default color for development workspaces
  }

  // Show the element in the status bar
  workspaceStatusBarItem.show();
  Logger.info(
    `Workspace status bar element for VTEX '${displayText}' displayed`
  );

  return workspaceStatusBarItem;
}

/**
 * Helper function to configure a status bar item for maximum compactness
 * @param item The status bar item to configure
 */
function configureCompactStatusBarItem(item: vscode.StatusBarItem): void {
  // In VS Code, the status bar items have a default padding
  // We can't directly modify CSS, but we can make sure there's no extra space in the text

  // We override text alignment to make sure it's aligned as compactly as possible
  // @ts-ignore - TextAlignmentOverride is available but not in all VS Code types
  if (item.alignmentOverride !== undefined) {
    // @ts-ignore
    item.alignmentOverride = 0; // Override alignment to be as compact as possible
  }

  // These are the properties we can modify to ensure a compact display
  item.name = "vtex-compact"; // For possible future use with themes

  // Remove leading/trailing whitespace in the text
  item.text = item.text.trim();
}
