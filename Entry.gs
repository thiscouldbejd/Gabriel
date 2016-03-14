/**
 * @OnlyCurrentDoc  Limits the script to only accessing the current document.
 */

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 *
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Adds a custom menu with items to show the sidebar and dialog.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
   
   createMenu(DocumentApp.getUi());
  
};

function createMenu(ui) {
  ui.createAddonMenu()
    .addItem("Start Publishing", "showSidebar")
    .addItem("Manage Repositories", "showRepos")
    .addItem("Authorising Gabriel", "showAuthorisation")
    .addItem("About Gabriel", "showAbout")
    .addToUi();
}
