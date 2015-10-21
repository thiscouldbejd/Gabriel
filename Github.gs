// ** GitScript **
// GitScript.Repo: Gabriel
// GitScript.File: Github.gs
// ** GitScript **

function getGithub() {
  return OAuth2.createService("github")
    .setAuthorizationBaseUrl(c.github_authUrl)
    .setTokenUrl(c.github_tokenUrl)
    .setClientId(c.github_clientID)
    .setClientSecret(c.github_clientSecret)
    .setCallbackFunction("authCallback")
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(c.github_scopes.join(" "))
}

function authCallback(request) {
  var github = getGithub();
  var isAuthorized = github.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

function getMe() {
  var response =  UrlFetchApp.fetch(c.github_serviceUrl + "/user", {
     method : "GET",
     contentType : "application/json",
     headers : {
       Accept : c.github_accept,
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  if (response.getResponseCode() == 200) {
    var user = JSON.parse(response.getContentText());
    return {
      username: user.login,
      name: user.name
    };
  }
}

function getRepos() {
  var response =  UrlFetchApp.fetch(c.github_serviceUrl + "/user/repos?type=all&per_page=1000&sort=updated", {
     method : "GET",
     contentType : "application/json",
     headers : {
       Accept : c.github_accept,
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  if (response.getResponseCode() == 200) {
    var repos = JSON.parse(response.getContentText());
    return repos.map(function(repo) {
      return {
        id: repo.id,
        name: repo.name,
        fullname: repo.full_name,
        owner: repo.owner.login
      };
    });
  } else {
    return [];
  }
}

function getFolders(repo_Name, path) {
  var url = c.github_serviceUrl + "/repos/" + repo_Name + "/contents/" + path;
  var response =  UrlFetchApp.fetch(url, {
     method : "GET",
     contentType : "application/json",
     headers : {
       Accept : c.github_accept,
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  if (response.getResponseCode() == 200) {
    var nodes = JSON.parse(response.getContentText());
    return nodes.map(function(node) {
      if (node.type == "dir") {
        return {
          type: "folder",
          name: node.name,
          path: node.path
        };
      } else if (node.type == "file") {
        return {
          type: "file",
          name: node.name,
          path: node.path,
          link: node.html_url
        };
      }
    });
  } else {
    return [];
  }
}

function getFile(repo_Name, path, fileName) {
  var p = path ? path + "/":"";
  var url = c.github_serviceUrl + "/repos/" + repo_Name + "/contents/" + p + fileName;
  var response =  UrlFetchApp.fetch(url, {
     method : "GET",
     muteHttpExceptions : true,
     contentType : "application/json",
     headers : {
       Accept : c.github_accept,
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  } else {
    return null;
  }
}

function postCommit(repo_Name, path, fileName, message, value, branch) {
  var existing_File = getFile(repo_Name, path, fileName);
  
  var p = path ? path + "/":"";
  var url = c.github_serviceUrl + "/repos/" + repo_Name + "/contents/" + p + fileName;
  var put_Payload = {};
  if (branch) put_Payload.branch = branch;
  if (existing_File) put_Payload.sha = existing_File.sha;
  put_Payload.message = message;
  put_Payload.content = value;
  var response =  UrlFetchApp.fetch(url, {
     method : "PUT",
     contentType : "application/json",
     payload : JSON.stringify(put_Payload),
     headers : {
       Accept : c.github_accept,
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  
  if (response.getResponseCode() == 200 || response.getResponseCode() == 201) {
    return JSON.parse(response.getContentText());
  } else {
    return false;
  }
}

function getDownload(url) {
  var response = UrlFetchApp.fetch(url, {
     method : "GET",
     headers : {
       Authorization: "token " + getGithub().getAccessToken()
     }
  });
  
  return response.getContentText();
}
