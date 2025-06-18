import * as vscode from "vscode";

/**
 * Clase para gestionar los iconos personalizados de la extensión
 */
export class IconManager {
  /**
   * Obtiene el código del icono VTEX para usar en la barra de estado
   * @param workspace El nombre del workspace actual (opcional)
   * @returns Un string con el icono adecuado según el contexto
   */
  public static getVtexIcon(workspace?: string): string {
    // En VS Code, los iconos personalizados no funcionan directamente en la barra de estado,
    // así que usamos iconos incorporados basados en el contexto

    // Si el workspace es master, usar un icono verificado en color
    if (workspace === "master") {
      return "$(verified-filled)"; // Icono de verificado relleno para master
    }

    // Si es otro workspace, usar un icono de laboratorio/desarrollo
    else if (workspace) {
      return "$(beaker)"; // Icono de laboratorio para workspaces de desarrollo
    }

    // Por defecto, usar el icono que más se parece al logo de VTEX
    return "$(symbol-misc)"; // Este icono podría representar el logo VTEX
  }

  /**
   * Detecta si el tema actual es oscuro
   * @returns true si el tema es oscuro, false si es claro
   */
  public static isDarkTheme(): boolean {
    const theme = vscode.window.activeColorTheme;
    return (
      theme.kind === vscode.ColorThemeKind.Dark ||
      theme.kind === vscode.ColorThemeKind.HighContrast
    );
  }
}
