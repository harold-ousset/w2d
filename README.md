# w2d
## wide domain delegation for Google Apps Script  

### Install  
Copy the file "w2d.gs" in your Google Apps Script and also copy a valid key Object (see part 'Initialize the script')

#### Syntax  
```
var w2dInstance = new w2d(user,scopes,key);
var token = w2dInstance.getToken().token;
```

#### Parameters  
**user**  
the email address of the user impersonated  
**scopes**  
an array with all the needed scopes. eg:  
['https://mail.google.com/','https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/calendar']  
**key**  
an Object containing at least {client_email, private_key}  

### Demo:

> **demo.gs**  

```
function log2000FirstFiles() {
  var user = 'email@domain.ext';
  var scopes = ['https://www.googleapis.com/auth/drive'];
  var key = {
    client_email: 'id@project_id.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n***********\n-----END PRIVATE KEY-----\n',
  };
  var token = new wd2(user, scopes, key).getToken().token;
  var files = [];
  var pageToken;

  /**
  * transform a file "Object" in an "Array" storable in the spreadsheet
  * @param {Object}
  * @return {Array}
  **/
  function fileDetailsToArray(file) {
    file.parents = file.parents || [];
    file.permissions = file.permissions || [];
    return ([file.name]);
  }

  do {
    var rep = getFiles(user, pageToken, token);
    var fileObj = rep.files;
    pageToken = rep.nextPageToken;
    if (fileObj instanceof Array) {
      files = files.concat(fileObj.map(
        fileDetailsToArray
      ));
    }
  }
  while (pageToken && files.length < 2000);
  Logger.log(files.join('\n'));
}

/**
* get the Drive files of a user
* @param {String} user, email of the user
* @param {String} pageToken, page token if there is one
* @param {String} token, a valid access token for the user and scope
* @return {Object} files, {nextPageToken, files[
*    {name, parents[], permissions[], size, createdTime, modifiedTime}
*  ]}
**/
function getFiles(user, pageToken, token) {
  // API page: https://developers.google.com/drive/v3/reference/files/list
  // scope: https://www.googleapis.com/auth/drive
  var params = {
    contentType: 'application/json',
    headers: {
      Authorization: ' OAuth ' + token,
    },
    muteHttpExceptions: true,
  };
  pageToken = pageToken || '';
  var url = 'https://www.googleapis.com/drive/v3/files' +
    '?fields=files(createdTime,id,modifiedTime,name,parents,permissions/emailAddress,size),' +
    'nextPageToken' +
    '&pageSize=1000' +
    '&q=\'' + user + '\' in owners and mimeType != \'application/vnd.google-apps.folder\'';
  if (pageToken !== '') {
    url += '&pageToken=' + encodeURIComponent(pageToken);
  }

  var result = fetchUrlFailProof(url, params);
  var obj = JSON.parse(result.getContentText());
  return obj;
}
```

## Initialize the script  
PROCESS TO OBTAIN A KEY
from the [Google Developer console](https://console.developers.google.com/)
 - Open a project or create a new project (for convenience I'll use here the project associated with the script)  
 From the appScript menu go to:  
 Resources > Developer Console Project...  
 ![resources>DevelopersConsole](http://i.imgur.com/SSNpBLQ.png)  

 - Activate the desired API  
 If you are trying to have the demo working activate the drive API from the library panel.  
![developerConsole>Library](http://i.imgur.com/4GsPOja.png)  

 - Create some credentials  
Open the credentials panel. Fill the informations in the 2d tab "OAuth consent screen" (it's only required to give a name for your app)  
![nameYourApp](http://i.imgur.com/ZwLqevu.png)  
Go back to the first tab and create some new creadentials of type service account (select "other") OR "service acount name" --> wide GAS connexion  
![serviceAccount](http://i.imgur.com/nsC7fqC.png)  
Save the JSON (this is your **KEY**)  
 - Activate the generated key
Click "Manage service account"  
![manageServiceAccount](http://i.imgur.com/E9bgUhJ.png)  
Edit the created service account (3 dot at the right of the line)  
![editKey](http://i.imgur.com/4a4BLIz.png)  
Activate delegation at the Domain level (Enable G Suite Domain-wide delegation)  
![allowWide](http://i.imgur.com/chxGZWW.png)  

 - activate the credential for the given scope in the admin plateform  
 Open the admin console and go to the managed clients https://admin.google.com/AdminHome?chromeless=1#OGX:ManageOauthClients  
enter the ID of the service account and the scope of interest  
![adminConsole](http://i.imgur.com/jBEjfLR.png)  
Your credentials are now ready to be used.
