import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "../helpers/logger";
import { executeVtexCommandSilently } from "./terminal";

// Paths to VTEX configuration files
const VTEX_SESSION_DIR = path.join(os.homedir(), ".vtex", "session");
const SESSION_FILE_PATH = path.join(VTEX_SESSION_DIR, "session.json");
const TOKENS_FILE_PATH = path.join(VTEX_SESSION_DIR, "tokens.json");

/**
 * Interface for complete VTEX information
 */
export interface VtexInfo {
  account?: string;
  workspace?: string;
}

/**
 * Reads the session.json file and gets the VTEX account name
 * @returns The account name or undefined if the file doesn't exist or doesn't have the account field
 */
export function getVtexAccount(): string | undefined {
  try {
    Logger.info(`Attempting to read session file: ${SESSION_FILE_PATH}`);

    // Check if the file exists
    if (!fs.existsSync(SESSION_FILE_PATH)) {
      Logger.info("session.json file doesn't exist");
      return undefined;
    }

    // Read and parse the file
    const sessionContent = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
    const sessionData = JSON.parse(sessionContent);
    
    // Check if it has the account field
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
 * Gets all available VTEX accounts from the tokens.json file
 * @returns Array with the names of available accounts
 */
export function getAvailableVtexAccounts(): string[] {
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
 * Gets the complete VTEX information (account and workspace)
 * @returns Object with account and workspace information
 */
export function getVtexInfo(): VtexInfo {
  const account = getVtexAccount();
  const workspace = getVtexWorkspace();

  return { account, workspace };
}

/**
 * Switches to a different VTEX account
 * @param accountName The name of the account to switch to
 */
export async function switchVtexAccount(accountName: string): Promise<void> {
  try {
    // Show progress notification during account switching
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Switching to VTEX account: ${accountName}...`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 50 });
        
        // Execute the account switch command silently
        const switchCommand = `vtex switch ${accountName}`;
        const output = await executeVtexCommandSilently(switchCommand, true, false);
        
        if (output.toLowerCase().includes("error") || output.toLowerCase().includes("failed")) {
          throw new Error(output.trim());
        }
        
        progress.report({ increment: 50 });
        
        // Show success message
        vscode.window.showInformationMessage(`Switched to VTEX account: ${accountName}`);
      }
    );
  } catch (error) {
    Logger.error(`Error executing switch command: ${error}`);
    vscode.window.showErrorMessage(`Error switching accounts: ${error}`);
  }
}

// Import at the bottom to avoid circular dependencies
import { getVtexWorkspace } from "./workspace";
