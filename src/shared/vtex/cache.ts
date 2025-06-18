import * as vscode from "vscode";
import { Logger } from "../helpers/logger";

// Define workspace cache interface
export interface WorkspaceCache {
  workspaces: Array<{ name: string; isActive: boolean; isProduction: boolean }>;
  timestamp: number;
  accountName: string;
}

// Cache settings key
const CACHE_KEY = "vtexIoUtilities.workspaceCache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Store for extension context
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Initialize the cache module with extension context
 * @param context VS Code extension context
 */
export function initializeCache(context: vscode.ExtensionContext): void {
  extensionContext = context;
  Logger.info(`Cache module initialized with extension context`);
}

/**
 * Saves workspaces to cache for a specific account
 * @param accountName The account name to save workspaces for
 * @param workspaces The workspaces to cache
 */
export async function cacheWorkspaces(
  accountName: string,
  workspaces: Array<{ name: string; isActive: boolean; isProduction: boolean }>
): Promise<void> {
  try {
    Logger.info(`Caching ${workspaces.length} workspaces for account ${accountName}`);
    
    if (!extensionContext) {
      Logger.error("Cannot cache workspaces: extension context not initialized");
      return;
    }
    
    // Get existing cache 
    const existingCache = await getWorkspaceCache();
    
    // Create new cache entry for this account
    const newCacheEntry: WorkspaceCache = {
      workspaces,
      timestamp: Date.now(),
      accountName
    };
    
    // Update existing cache with new entry
    existingCache[accountName] = newCacheEntry;
    
    Logger.info(`Storing cache for account: ${accountName}, cache keys: ${Object.keys(existingCache).join(', ')}`);
    
    // Save updated cache to extension storage
    extensionContext.globalState.update(CACHE_KEY, existingCache);
    
    // Verify the update worked by reading the cache again
    const verifyCache = await getWorkspaceCache();
    const saved = !!verifyCache[accountName];
    Logger.info(`Verification - Cache saved successfully: ${saved}, account: ${accountName}`);
    
    Logger.info(`Successfully cached workspaces for account ${accountName}`);
  } catch (error) {
    Logger.error(`Error caching workspaces: ${error}`);
  }
}

/**
 * Gets workspaces from cache for a specific account
 * @param accountName The account name to get workspaces for
 * @returns The cached workspaces or undefined if no cache exists or it's expired
 */
export async function getCachedWorkspaces(
  accountName: string
): Promise<Array<{ name: string; isActive: boolean; isProduction: boolean }> | undefined> {
  try {
    Logger.info(`Checking cache for workspaces of account ${accountName}`);
    
    if (!extensionContext) {
      Logger.error("Cannot get cached workspaces: extension context not initialized");
      return undefined;
    }
    
    // Get cache from extension storage
    const cache = await getWorkspaceCache();
    
    // Check if we have a cache entry for this account
    const cacheEntry = cache[accountName];
    if (!cacheEntry) {
      Logger.info(`No cache found for account ${accountName}`);
      return undefined;
    }
    
    // Check if cache is still valid (not expired)
    const now = Date.now();
    if (now - cacheEntry.timestamp > CACHE_TTL) {
      Logger.info(`Cache for account ${accountName} has expired`);
      return undefined;
    }
    
    Logger.info(`Found ${cacheEntry.workspaces.length} cached workspaces for account ${accountName}`);
    return cacheEntry.workspaces;
  } catch (error) {
    Logger.error(`Error getting cached workspaces: ${error}`);
    return undefined;
  }
}

/**
 * Clears the workspace cache for a specific account
 * @param accountName The account name to clear cache for, or undefined to clear all accounts
 */
export async function clearWorkspaceCache(accountName?: string): Promise<void> {
  try {
    if (!extensionContext) {
      Logger.error("Cannot clear workspace cache: extension context not initialized");
      return;
    }
    
    if (accountName) {
      Logger.info(`Clearing workspace cache for account ${accountName}`);
      
      // Get existing cache
      const existingCache = await getWorkspaceCache();
      
      // Remove entry for specified account
      if (existingCache[accountName]) {
        delete existingCache[accountName];
        
        // Save updated cache
        extensionContext.globalState.update(CACHE_KEY, existingCache);
      }
      
      Logger.info(`Cache cleared for account ${accountName}`);
    } else {
      Logger.info(`Clearing all workspace cache entries`);
      
      // Clear entire cache
      extensionContext.globalState.update(CACHE_KEY, {});
      
      Logger.info(`All cache entries cleared`);
    }
  } catch (error) {
    Logger.error(`Error clearing workspace cache: ${error}`);
  }
}

/**
 * Updates the active state of workspaces in the cache for a specific account
 * @param accountName The account name to update cache for
 * @param activeWorkspace The name of the workspace that should be marked as active
 * @returns True if the cache was updated successfully, false otherwise
 */
export async function updateActiveWorkspaceInCache(
  accountName: string,
  activeWorkspace: string
): Promise<boolean> {
  try {
    Logger.info(`Updating active workspace in cache to ${activeWorkspace} for account ${accountName}`);
    
    if (!extensionContext) {
      Logger.error("Cannot update active workspace in cache: extension context not initialized");
      return false;
    }
    
    // Get existing cache
    const existingCache = await getWorkspaceCache();
    
    // Check if we have a cache entry for this account
    const cacheEntry = existingCache[accountName];
    if (!cacheEntry) {
      Logger.info(`No cache found for account ${accountName}, nothing to update`);
      return false;
    }
    
    // Update the active state of workspaces
    let updated = false;
    for (const ws of cacheEntry.workspaces) {
      if (ws.name === activeWorkspace) {
        if (!ws.isActive) {
          ws.isActive = true;
          updated = true;
        }
      } else if (ws.isActive) {
        ws.isActive = false;
        updated = true;
      }
    }
    
    if (!updated) {
      Logger.info(`No changes needed to workspace active states in cache for ${accountName}`);
      return false;
    }
    
    // Save updated cache to extension storage
    extensionContext.globalState.update(CACHE_KEY, existingCache);
    
    Logger.info(`Successfully updated active workspace to ${activeWorkspace} in cache for account ${accountName}`);
    return true;
  } catch (error) {
    Logger.error(`Error updating active workspace in cache: ${error}`);
    return false;
  }
}

/**
 * Helper function to get the workspace cache from extension storage
 * @returns The workspace cache object
 */
async function getWorkspaceCache(): Promise<Record<string, WorkspaceCache>> {
  if (!extensionContext) {
    Logger.error("Cannot get workspace cache: extension context not initialized");
    return {};
  }
  
  // Get cache from extension storage
  const cache = extensionContext.globalState.get<Record<string, WorkspaceCache>>(CACHE_KEY);
  
  // Log cache state
  Logger.info(`Reading workspace cache. Has cache: ${!!cache}, Cache keys: ${cache ? Object.keys(cache).join(', ') : 'none'}`);
  
  // Return cache or empty object if none exists
  return cache || {};
}

/**
 * Removes a specific workspace from cache for an account
 * @param accountName The account name to update cache for
 * @param workspaceName The name of the workspace to remove from cache
 * @returns True if the workspace was removed, false otherwise
 */
export async function removeWorkspaceFromCache(
  accountName: string,
  workspaceName: string
): Promise<boolean> {
  try {
    Logger.info(`Removing workspace ${workspaceName} from cache for account ${accountName}`);
    
    if (!extensionContext) {
      Logger.error("Cannot update workspace cache: extension context not initialized");
      return false;
    }
    
    // Get existing cache
    const existingCache = await getWorkspaceCache();
    
    // Check if we have a cache entry for this account
    const cacheEntry = existingCache[accountName];
    if (!cacheEntry) {
      Logger.info(`No cache found for account ${accountName}, nothing to update`);
      return false;
    }
    
    // Find and remove the workspace
    const initialLength = cacheEntry.workspaces.length;
    cacheEntry.workspaces = cacheEntry.workspaces.filter(ws => ws.name !== workspaceName);
    
    // If no change in length, the workspace wasn't found
    if (cacheEntry.workspaces.length === initialLength) {
      Logger.info(`Workspace ${workspaceName} not found in cache for ${accountName}`);
      return false;
    }
    
    // Save updated cache to extension storage
    extensionContext.globalState.update(CACHE_KEY, existingCache);
    
    Logger.info(`Successfully removed workspace ${workspaceName} from cache for account ${accountName}`);
    return true;
  } catch (error) {
    Logger.error(`Error removing workspace from cache: ${error}`);
    return false;
  }
}

/**
 * Sets the workspace cache with a timestamp of now, forcing a refresh to happen
 * without losing other cache information
 * @param accountName The account name to mark for refresh
 * @returns True if the cache was updated successfully, false otherwise
 */
export async function markWorkspacesCacheForRefresh(
  accountName: string
): Promise<boolean> {
  try {
    Logger.info(`Marking workspaces cache for refresh for account ${accountName}`);
    
    if (!extensionContext) {
      Logger.error("Cannot mark workspaces cache: extension context not initialized");
      return false;
    }
    
    // Get existing cache
    const existingCache = await getWorkspaceCache();
    
    // Check if we have a cache entry for this account
    const cacheEntry = existingCache[accountName];
    if (!cacheEntry) {
      Logger.info(`No cache found for account ${accountName}, nothing to mark for refresh`);
      return false;
    }
    
    // Set timestamp to 0 to force a refresh next time they're requested
    cacheEntry.timestamp = 0;
    
    // Save updated cache to extension storage
    extensionContext.globalState.update(CACHE_KEY, existingCache);
    
    Logger.info(`Successfully marked workspace cache for refresh for account ${accountName}`);
    return true;
  } catch (error) {
    Logger.error(`Error marking workspace cache for refresh: ${error}`);
    return false;
  }
}
