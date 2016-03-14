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
    showGithubAuthFlow(github);
  } else {
    var page = HtmlService.createTemplateFromFile("Sidebar")
      .evaluate()
      .setTitle(c.title)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    DocumentApp.getUi().showSidebar(page);
  }
}

function reAuthorise() {
  var github = getGithub();
  github.reset();
  showGithubAuthFlow(github);
}

function showGithubAuthFlow(github) {
  var authorizationUrl = github.getAuthorizationUrl();
  var template = HtmlService.createTemplateFromFile("PreAuthSidebar");
  template.authorizationUrl = authorizationUrl;
  var page = template
              .evaluate()
              .setTitle(c.title)
              .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showSidebar(page);
}

function showRepos() {
  var template = HtmlService.createTemplateFromFile("RepoDialog");
  var page = template
              .evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setWidth(500)
              .setHeight(270);
  DocumentApp.getUi()
      .showModalDialog(page, "Manage Visibility of Github Repositories");
}

function showAuthorisation() {
  var template = HtmlService.createTemplateFromFile("AuthorisationDialog");
  var page = template
              .evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setWidth(500)
              .setHeight(270);
  DocumentApp.getUi()
      .showModalDialog(page, "Authorising Gabriel");
}

function showAbout() {
  var template = HtmlService.createTemplateFromFile("AboutDialog");
  var page = template
              .evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setWidth(500)
              .setHeight(320);
  DocumentApp.getUi()
      .showModalDialog(page, "About Gabriel");
}

/**
 * Clears the stored document metadata
 */
function clearData() {
  var ui = DocumentApp.getUi();
  var response = ui.alert("Clear details about this document?", "All details in the sidebar will be cleared, but nothing in your document will change.", ui.ButtonSet.YES_NO)
  
  if (response && response == "YES") {
    clearPrefixedProperties(PropertiesService.getDocumentProperties(), c, "data_");
    showSidebar();
  }
}
// == Menu Handlers == //


// == Data Handlers == //

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

// -- User Hidden Repos -- //
/**
 * Returns the user tags.
 *
 * @return {Array} the current user tags.
 */
function getHiddenRepos() {
  return getArrayProperty(PropertiesService.getUserProperties(), c.user_hiddenRepos);
}

/**
 * Changes the user tags.
 *
 * @param {Array} values the new tags to use for the user.
 */
function setHiddenRepos(values) {
  setArrayProperty(PropertiesService.getUserProperties(), c.user_hiddenRepos, values);
}


// -- User Hidden Repos -- //

// -- Post Meta -- //
/**
 * Returns the post meta data.
 *
 * @return {Object} the current post metadata.
 */
function getMeta() {
  var value = {};
  
  value.tags = getArrayProperty(PropertiesService.getDocumentProperties(), c.data_tags);
  value.title = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_title, DocumentApp.getActiveDocument().getName());
  value.filename = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_filename, new Date().toISOString().split("T")[0] + "-" + value.title.split(" ").join("-") + ".md");
  value.link = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_link, "/" + value.title.toLowerCase().split(" ").join("-") + "/");
  value.author = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_author, Session.getEffectiveUser().getEmail().split("@")[0]);
  value.type = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_type, "post");
  value.targets = getArrayProperty(PropertiesService.getDocumentProperties(), c.data_targets);
  
  return value;
}

/**
 * Changes the post meta data.
 *
 * @param {Object} values the new metadata to use for the post.
 */
function setMeta(value) {
  
  setArrayProperty(PropertiesService.getDocumentProperties(), c.data_tags, value.tags);
  if (value.title != DocumentApp.getActiveDocument().getName()) 
    setScalarProperty(PropertiesService.getDocumentProperties(), c.data_title, value.title);
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_filename, value.filename);
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_link, value.link);
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_author, value.author);
  setScalarProperty(PropertiesService.getDocumentProperties(), c.data_type, value.type);
  setArrayProperty(PropertiesService.getDocumentProperties(), c.data_targets, value.targets);
  
}
// -- Post Tags -- //

// == Data Handlers == //

// == Show Handlers == //
function getFilteredRepos() {
  var repos = getRepos();
  var hiddenRepos = getHiddenRepos();
  
  if (repos && hiddenRepos) {
  
    var repos_L = repos.length;
    var hiddenRepos_L = hiddenRepos.length;
    
    for (var i = 0; i < repos_L; i++) {
    
      if (hiddenRepos_L == 0) break;
      
      for (var j = 0; j < hiddenRepos_L; j++) {
      
        if (repos[i]["fullname"] == hiddenRepos[j]) {
          
          repos.splice(i, 1);
          i -= 1;
          repos_L -= 1;
          
          hiddenRepos.splice(j, 1);
          hiddenRepos_L -= 1;
          
          break;
        }
      
      }
      
    }
    
  }
  
  return repos;
  
}

// == Show Handlers == //

// == Action Handlers == //
function commitToGithub(yaml_Metadata) {

    var targets = getArrayProperty(PropertiesService.getDocumentProperties(), c.data_targets);
    
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
        
        var repo_File = getScalarProperty(PropertiesService.getDocumentProperties(), c.data_filename);
        var repo_FileKey = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, repo_File, Utilities.Charset.US_ASCII));
  
        repo_FileKey = repo_FileKey.replace(/\W+/g, "");
        
        if (repo_FileKey) {
        
          var markdown_Document = ConvertToMarkdown(assets_Path, repo_FileKey);
          if (markdown_Document) {
            markdown_Document.contents = yaml_Metadata + "\n" + markdown_Document.contents;        
            var repo_Path = targets[i].split("::")[1];
            var file = postCommit(repo_Name, repo_Path, repo_File, "Update/Create " + repo_File, Utilities.base64Encode(markdown_Document.contents, Utilities.Charset.UTF_8));
            
            if (markdown_Document.attachments && markdown_Document.attachments.length > 0) {
            
              for (var j = 0; j < markdown_Document.attachments.length; j++) {
                postCommit(repo_Name, assets_Path, markdown_Document.attachments[j].fileName, 
                  "Update/Create " + markdown_Document.attachments[j].fileName, 
                  Utilities.base64Encode(markdown_Document.attachments[j].content));
              }
          
            }
            
            if (file) return file.content.html_url;
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
