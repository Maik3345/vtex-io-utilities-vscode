import * as vscode from "vscode";
import { Logger } from "../helpers/logger";
import { getVtexAccount, getAvailableVtexAccounts, getVtexInfo, switchVtexAccount } from "./account";
import { executeCommandInTerminal } from "./terminal";

// Global variables for status bar elements
let statusBarItem: vscode.StatusBarItem | undefined;
let workspaceStatusBarItem: vscode.StatusBarItem | undefined;

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
 * Handles the click event on the status bar element.
 * Shows a context menu with available accounts and additional options.
 */
export async function handleStatusBarClick(): Promise<void> {
  const vtexInfo = getVtexInfo();

  // Get all available accounts
  const availableAccounts = getAvailableVtexAccounts();

  // Create separate arrays for each option type
  const accountOptions: string[] = [];
  const actions: string[] = ["$(add) Add account manually", "List account information"];

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

      // Switch to the selected account
      await switchVtexAccount(accountName);
    } else if (selection === "$(add) Add account manually") {
      // Show input box to enter account name manually
      const accountName = await vscode.window.showInputBox({
        prompt: "Enter the name of the VTEX account to switch to",
        placeHolder: "account-name",
        title: "Add VTEX Account Manually",
        validateInput: (value) => {
          // Validate the account name format (modify as needed based on VTEX account naming rules)
          if (!value || value.trim() === '') {
            return "Account name cannot be empty";
          }
          return null; // No validation error
        },
        ignoreFocusOut: true,
      });
      
      if (accountName) {
        // Switch to the manually entered account
        await switchVtexAccount(accountName);
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

/**
 * Updates both status bar elements with current VTEX information
 */
export function updateVtexStatusBar(): void {
  getStatusBar();
  getWorkspaceStatusBar();
}
