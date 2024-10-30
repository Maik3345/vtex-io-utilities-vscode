<h1 align="center">
  <br>
    <img align="center" src="img/logo.png" width="200">
  <br>
 <br>
  VTEX IO Utilities for Visual Studio Code
  <br>
  <br>
</h1>

### How do I use the extension?

You can open the Command Palette (`Ctrl+Shift+P`) and run the commands.

### What commands are available?

- **Create a VTEX IO diagram**: Create a diagram of your VTEX IO app in the current workspace or the selected directory using the contextual menu in the editor.

### Commands description

- **Create a VTEX IO diagram**: This command will create a diagram of your VTEX IO app dependencies in the current workspace or the selected folder, to generate the diagram the extension read the `manifest.json` file in the main folders only

This command helps you to visualize the dependencies of your VTEX IO app in a diagram, you can see the dependencies between the apps and the blocks.

### Contextual menu

You can use the contextual menu in the editor to run the next commands:

- **Create a VTEX IO diagram**: Create a diagram of your VTEX IO app in the current workspace or the selected directory.
- **Copy install VTEX apps command** and **Copy deploy VTEX apps command**: This commands allows you to select directories or use the current workspace to generate a list of apps to install based on the current version specified in the `manifest.json` file. It then copies the install command to the clipboard for easy pasting and execution in your terminal.

### How to install the extension?

You can install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=MaikRestrepo.vtex-io-utilities-vscode)
