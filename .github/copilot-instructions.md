# Copilot Instructions for VTEX IO Utilities VS Code Extension

## Architecture Overview

- **Purpose:** VS Code extension for VTEX IO developers, providing workspace/account management, diagram generation, and command utilities.
- **Main Components:**
  - `src/extension.ts`: Entry point, status bar setup, file watchers, command registration.
  - `src/shared/vtex/`: Modular logic for VTEX account, workspace, terminal, status bar, and persistent cache.
  - `src/commands/`: Command handlers for extension features.
  - `src/shared/watchers/`: File watchers for VTEX config changes.
  - `src/shared/vtex/cache.ts`: Per-account workspace cache using VS Code extension context (`globalState`).

## Developer Workflows

- **Build:** Use `npm run watch` for live TypeScript compilation via webpack.
- **Release:** Use `npm run build` and `vsce publish` for packaging and publishing.
- **Debug:** Status bar and workspace/account changes are logged via the custom `Logger` utility.
- **File Monitoring:** Watches `.vtex/session/session.json` and `.vtex/session/workspace.json` for external changes, updating UI and cache accordingly.

## Key Patterns & Conventions

- **Status Bar UI:** Shows current VTEX account and workspace. Clicking opens QuickPick menus for switching, creating, or deleting workspaces/accounts.
- **Workspace Cache:** Workspace lists are cached per account. Cache is updated on workspace/account changes, and can be manually refreshed.
- **Account Switching:** Supports switching between detected accounts and manual entry of new accounts.
- **Workspace Management:** Supports switching, creating, and deleting workspaces. Deletion clears cache for the account.
- **Command Registration:** All commands are registered in `registerCommands` in `extension.ts` using keys from `src/constants/index.ts`.
- **Terminal Execution:** VTEX CLI commands are run via helper functions in `src/shared/vtex/terminal.ts`.

## Integration Points

- **VTEX CLI:** All workspace/account operations are performed by shelling out to the VTEX CLI.
- **VS Code API:** Uses status bar, QuickPick, globalState, and file system watchers for UI and persistence.

## Examples

- To update the workspace cache after switching: See `updateActiveWorkspaceInCache` in `src/shared/vtex/cache.ts` and its usage in `src/shared/vtex/workspace.ts`.
- To add a new account manually: See QuickPick logic in `src/shared/vtex/statusBar.ts` for manual account entry.
- To handle external workspace changes: See watcher setup in `src/shared/watchers/vtexFileWatcher.ts`.

## Project-Specific Advice

- Do not clear workspace cache on every workspace switch—update the active workspace in cache instead.
- Always use extension context (`globalState`) for persistent cache.
- Use the provided Logger for all debug/info/error output.
- Keep UI logic (QuickPick, status bar) in the shared modules, not in command handlers.

## 🎯 Sistema de Activación por Palabras Clave

**INSTRUCCIÓN PARA COPILOT:** Cuando detectes cualquiera de estas palabras clave en el prompt del usuario, activa automáticamente las instrucciones correspondientes:

---

### 📋 Conventional Commits

**Palabras clave:** `"commit"` | `"conventional commit"` | `"formato commit"` | `"mensaje commit"`  
**→ ACTIVAR:** [commit.instructions.md](./instructions/commit/commit.instructions.md)  
**Acción:** Aplica las reglas de Conventional Commits 1.0.0 para estructurar mensajes de commit consistentes

### 🧪 Cobertura de Tests

**Palabras clave:** `"coverage"` | `"test-coverage"` | `"cobertura"` | `"sonar quality gate"` | `"cobertura tests"`  
**→ ACTIVAR:** [coverage.instructions.md](./instructions/coverage/coverage.instructions.md)  
**Acción:** Mejora sistemáticamente la cobertura de tests hasta alcanzar el 87% requerido por SonarQube

### 📚 Documentación General

**Palabras clave:** `"doc"` | `"documentación"` | `"generar docs"` | `"crear documentación"`  
**→ ACTIVAR:** [doc.instructions.md](./instructions/doc/doc.instructions.md)  
**Acción:** Genera documentación detallada en la carpeta docs con diagramas Mermaid y actualiza README.md

### 📋 Pull Request y Control de Versiones

**Palabras clave:** `"pr"` | `"pull request"` | `"crear pr"` | `"generar pr"`  
**→ ACTIVAR:** [pr-auto-fill.instructions.md](./instructions/pr/pr-auto-fill.instructions.md)  
**Acción:** Automatiza la generación del contenido de Pull Request basándose en el template y el historial de cambios

---

### 🤖 Para Copilot: Reglas de Activación Automática

1. **Detecta las palabras clave** en el prompt del usuario (sin importar mayúsculas/minúsculas)
2. **Activa automáticamente** las instrucciones del archivo correspondiente
3. **Sigue las instrucciones específicas** del archivo referenciado
4. **No requieras** que el usuario mencione explícitamente las instrucciones
5. **Ejecuta la tarea** según el flujo definido en las instrucciones específicas
