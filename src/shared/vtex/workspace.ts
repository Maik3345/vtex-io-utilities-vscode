import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "../helpers/logger";
import { executeCommandInTerminal, executeVtexCommandSilently } from "./terminal";
import { getVtexAccount } from "./account";
import { cacheWorkspaces, getCachedWorkspaces, clearWorkspaceCache, updateActiveWorkspaceInCache } from "./cache";

// Paths to VTEX configuration files
const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
const WORKSPACE_FILE_PATH = path.join(VTEX_SESSION_DIR, "workspace.json");

/**
 * Reads the workspace.json file and gets the current workspace
 * @returns The workspace name or undefined if the file doesn't exist or doesn't have the currentWorkspace field
 */
export function getVtexWorkspace(): string | undefined {
  try {
    Logger.info(`Attempting to read workspace file: ${WORKSPACE_FILE_PATH}`);

    // Check if the file exists
    if (!fs.existsSync(WORKSPACE_FILE_PATH)) {
      Logger.info("workspace.json file doesn't exist");
      return undefined;
    }

    // Read and parse the file
    const workspaceContent = fs.readFileSync(WORKSPACE_FILE_PATH, "utf-8");
    const workspaceData = JSON.parse(workspaceContent);
    
    // Check if it has the currentWorkspace field
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
 * Parses the output of "vtex workspace list" command to extract available workspaces
 * @param output The command output string
 * @returns An array of workspace objects with name, isActive, isProduction properties
 */
export function parseWorkspaceListOutput(
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
 * Shows workspace options when workspace list can't be automatically parsed
 * @param terminalName The name of the terminal to use for commands
 * @param currentWorkspace The current workspace name
 */
export async function showWorkspaceOptions(
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
    placeHolder: "Select an option to work with workspaces",
    title: currentWorkspace
      ? `Current workspace: ${currentWorkspace}`
      : "No current workspace detected",
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
        // Execute the workspace switch command
        const switchCommand = `vtex use ${workspaceName}`;
        await executeVtexCommandSilently(switchCommand, true, true);

        vscode.window.showInformationMessage(
          `Switching to workspace: ${workspaceName}`
        );
      }
    }
  }
}

/**
 * Helper function to create a new workspace
 * @param terminalName The name of the terminal to use for commands
 */
export async function createNewWorkspace(terminalName: string): Promise<void> {
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
    // Execute the create workspace command
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
export async function deleteWorkspace(workspaceName: string): Promise<void> {
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
    // Ask for confirmation
    const confirmDelete = await vscode.window.showWarningMessage(
      `Are you sure you want to delete workspace '${workspaceName}'?`,
      { modal: true },
      'Yes, delete it',
      'Cancel'
    );
    
    // If user didn't confirm, exit early
    if (confirmDelete !== 'Yes, delete it') {
      return;
    }
    
    // Execute the delete workspace command silently
    const deleteCommand = `vtex workspace delete ${workspaceName}`;
    
    // Show progress notification
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Deleting workspace: ${workspaceName}...`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 50 });
        
        const output = await executeVtexCommandSilently(deleteCommand, true, false);
        
        if (
          output.toLowerCase().includes("error") ||
          output.toLowerCase().includes("failed")
        ) {
          throw new Error(output.trim());
        }
        
        progress.report({ increment: 50 });
        
        // Show success message
        vscode.window.showInformationMessage(`Workspace deleted: ${workspaceName}`);
      }
    );
  } catch (error) {
    Logger.error(`Error deleting workspace: ${error}`);
    vscode.window.showErrorMessage(`Error deleting workspace: ${error}`);
  }
}

/**
 * Handles click on the workspace status bar item.
 * Gets workspaces from cache or CLI, parses the output, and shows a QuickPick with workspaces.
 */
export async function handleWorkspaceStatusBarClick(): Promise<void> {
  try {
    Logger.info("Listing available VTEX workspaces...");

    // Define the command to list workspaces
    const command = "vtex workspace list";
    const terminalName = "VTEX Workspace";

    // Get the current account and workspace
    const currentAccount = getVtexAccount();
    const currentWorkspace = getVtexWorkspace();

    // Show progress while we're getting workspaces
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Getting VTEX workspaces...",
        cancellable: false,
      },
      async (progress) => {
        try {
          let workspaces: Array<{
            name: string;
            isActive: boolean;
            isProduction: boolean;
          }> = [];
          let fromCache = false;

          // Try to get workspaces from cache first
          if (currentAccount) {
            const cachedWorkspaces = await getCachedWorkspaces(currentAccount);
            
            if (cachedWorkspaces && cachedWorkspaces.length > 0) {
              workspaces = cachedWorkspaces;
              fromCache = true;
              Logger.info(`Using ${workspaces.length} workspaces from cache for account ${currentAccount}`);
              progress.report({
                increment: 100,
                message: `Found ${workspaces.length} workspaces in cache`,
              });
            }
          }

          // If no cache, get from CLI
          if (workspaces.length === 0) {
            progress.report({
              increment: 30,
              message: "Getting workspaces from VTEX CLI...",
            });

            // Execute the command silently and capture output
            const output = await executeVtexCommandSilently(
              command,
              false // Don't update status bar yet
            );

            progress.report({
              increment: 30,
              message: "Parsing workspace data...",
            });

            // Parse the output to get workspace list
            workspaces = parseWorkspaceListOutput(output);

            // Cache the workspaces if we got them successfully and have an account
            if (workspaces.length > 0 && currentAccount) {
              await cacheWorkspaces(currentAccount, workspaces);
            }

            progress.report({
              increment: 40,
              message: `Found ${workspaces.length} workspaces`,
            });
          }

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

          // Add "refresh from VTEX CLI" option at the top if data is from cache
          const refreshOption = fromCache ? [
            {
              label: "$(refresh) Refresh workspaces",
              description: "Get the latest workspaces from VTEX CLI",
              action: "refresh"
            }
          ] : [];

          // Add additional options
          const additionalOptions = [
            {
              label: "",
              description: "Actions",
              kind: vscode.QuickPickItemKind.Separator,
            },
            {
              label: "$(plus) Create a new workspace",
              description: "Create and switch to a new VTEX workspace",
              action: "create",
            },
          ];

          // Combine all options
          const quickPickItems = [
            ...refreshOption,
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

          // Show the QuickPick with a indicator if showing from cache
          const title = fromCache 
            ? `VTEX Workspaces (Current: ${currentWorkspace || "None"}) $(database) From Cache`
            : `VTEX Workspaces (Current: ${currentWorkspace || "None"})`;

          const selection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: "Select a workspace to switch to or create a new one",
            title,
            ignoreFocusOut: true,
          });

          if (!selection) {
            return; // User cancelled
          }

          if ((selection as any).action === "refresh") {
            // Clear cache and reload
            if (currentAccount) {
              await clearWorkspaceCache(currentAccount);
              // Call this function again to reload fresh data
              return handleWorkspaceStatusBarClick();
            }
          } else if ((selection as any).action === "create") {
            // Handle create new workspace
            await createNewWorkspace(terminalName);
          } else if (
            (selection as any).action === "delete" &&
            (selection as any).workspace
          ) {
            // Handle workspace deletion
            const workspaceToDelete = (selection as any).workspace;
            await deleteWorkspace(workspaceToDelete);
            
            // For deletion operations, we need to clear the cache since a workspace no longer exists
            if (currentAccount) {
              await clearWorkspaceCache(currentAccount);
            }
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
            
            // Update the active workspace in cache instead of clearing it
            if (currentAccount) {
              await updateActiveWorkspaceInCache(currentAccount, selectedWorkspace);
            }
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
