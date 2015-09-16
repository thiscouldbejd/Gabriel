/**
 * @OnlyCurrentDoc  Limits the script to only accessing the current document.
 */

// == Menu Handlers == //
/**
 * Opens a sidebar. The sidebar structure is described in the Sidebar.html
 * project file.
 */
function showSidebar() {
  var github = getGithub();
  if (!github.hasAccess()) {
    var authorizationUrl = github.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    DocumentApp.getUi().showSidebar(page);
  } else {
    var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(c.title)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    DocumentApp.getUi().showSidebar(ui);
  }
}

/**
 * Clears the stored document metadata
 */
function clearData() {
  var ui = DocumentApp.getUi();
  var response = ui.alert("Confirmation Required", "Are you5 sure you want to clear configuration?", ui.ButtonSet.YES_NO)
  
  if (response && response == "YES") clearPrefixedProperties(PropertiesService.getDocumentProperties(), c, "data_");
}
// == Menu Handlers == //


// == Data Handlers == //

// -- Post Title -- //
/**
 * Returns the post title.
 *
 * @return {String} the current post title.
 */
function getTitle() {
  return getScalarProperty(PropertiesService.getDocumentProperties(), c.data_title, DocumentApp.getActiveDocument().getName());
}

/**
 * Changes the post title.
 *
 * @param {String} value the new title to use for the post.
 */
function setTitle(value) {
  if (value != DocumentApp.getActiveDocument().getName()) 
    setScalarProperty(PropertiesService.getDocumentProperties(), c.data_title, value);
}
// -- Post Title -- //

// -- File Name -- //
/**
 * Returns the post file name.
 *
 * @return {String} the current post file name.
 */
function getFileName() {
  return getScalarProperty(PropertiesService.getDocumentProperties(), c.data_filename);
}

/**
 * Changes the post file name.
 *
 * @param {String} value the new file name to use for the post.
 */
function setFileName(value) {
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_filename, value);
}
// -- File Name -- //

// -- Post Permalink -- //
/**
 * Returns the post permalink.
 *
 * @return {String} the current post permalink.
 */
function getPermalink() {
  return getScalarProperty(PropertiesService.getDocumentProperties(), c.data_link);
}

/**
 * Changes the post permalink.
 *
 * @param {String} value the new permalink to use for the post.
 */
function setPermalink(value) {
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_link, value);
}
// -- Post Permalink -- //

// -- Post Type -- //
/**
 * Returns the post type.
 *
 * @return {String} the current post type.
 */
function getType() {
  return getScalarProperty(PropertiesService.getDocumentProperties(), c.data_type, "post");
}

/**
 * Changes the post type.
 *
 * @param {String} value the new type to use for the post.
 */
function setType(value) {
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_type, value);
}
// -- Post Type -- //

// -- Post Author -- //
/**
 * Returns the post author.
 *
 * @return {String} the current post author.
 */
function getAuthor() {
  return getScalarProperty(PropertiesService.getDocumentProperties(), c.data_author, Session.getEffectiveUser().getEmail().split("@")[0]);
}

/**
 * Changes the post author.
 *
 * @param {String} value the new author to use for the post.
 */
function setAuthor(value) {
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_author, value);
}
// -- Post Author -- //

// -- Post Tags -- //
/**
 * Returns the post tags.
 *
 * @return {Array} the current post tags.
 */
function getTags() {
  return getArrayProperty(PropertiesService.getDocumentProperties(), c.data_tags);
}

/**
 * Changes the post tags.
 *
 * @param {Array} values the new tags to use for the post.
 */
function setTags(values) {
  setArrayProperty(PropertiesService.getDocumentProperties(), c.data_tags, values);
}
// -- Post Tags -- //
  
// -- Post Targets -- //
/**
 * Returns the post targets (e.g. a destination for the post/file).
 *
 * @return {Array} the current post targets.
 */
function getTargets() {
  return getArrayProperty(PropertiesService.getDocumentProperties(), c.data_targets);
}

/**
 * Changes the post targets (e.g. a destination for the post/file).
 *
 * @param {Array} values the new targets to use for the post.
 */
function setTargets(values) {
  setArrayProperty(PropertiesService.getDocumentProperties(), c.data_targets, values);
}
// -- Post Targets -- //

// -- User Tags -- //
/**
 * Returns the user tags.
 *
 * @return {Array} the current user tags.
 */
function getAllTags() {
  return getArrayProperty(PropertiesService.getUserProperties(), c.user_tags);
}

/**
 * Changes the user tags.
 *
 * @param {Array} values the new tags to use for the user.
 */
function setAllTags(values) {
  setArrayProperty(PropertiesService.getUserProperties(), c.user_tags, values);
}
// -- User Tags -- //

// == Data Handlers == //

// == Action Handlers == //
function commitToGithub(yaml_Metadata) {

    var targets = getTargets();
    if (targets && targets.length > 0) {
      for (var i = 0; i < targets.length; i++) {
      
        var repo_Name = targets[i].split("::")[0];
        
        var assets_Path = c.defaults_assetPath;
        var config_File = getFile(repo_Name, "", c.defaults_ymlConfig);
        
        // -- Get & Parse the YAML File from the GitHub Repo/Jekyll Install -- //
        if (config_File) {
          var config_Text = getDownload(config_File.download_url);
          var config_Doc = jsyaml.load(config_Text);
          if (config_Doc[c.defaults_ymlAssetPathKey]) assets_Path = config_Doc[c.defaults_ymlAssetPathKey];
        }
        
        var markdown_Document = ConvertToMarkdown(assets_Path);
        if (markdown_Document) {
          markdown_Document.contents = yaml_Metadata + "\n" + markdown_Document.contents;
    
          var repo_Path = targets[i].split("::")[1];
          var repo_File = getFileName();
          var file = postCommit(repo_Name, repo_Path, repo_File, "Update/Create " + repo_File, Utilities.base64Encode(markdown_Document.contents));
        
          if (markdown_Document.attachments && markdown_Document.attachments.length > 0) {
          
            for (var j = 0; j < markdown_Document.attachments.length; j++) {
              postCommit(repo_Name, assets_Path, markdown_Document.attachments[j].fileName, 
                "Update/Create " + markdown_Document.attachments[j].fileName, 
                Utilities.base64Encode(markdown_Document.attachments[j].content));
            }
        
          }
        }
      }
    }
}

function showDialog(message, title) {
  var ui = DocumentApp.getUi();
  if (title) {
    ui.alert(title, message, ui.ButtonSet.OK);
  } else {
    ui.alert(title);
  }
}
// == Action Handlers == //
