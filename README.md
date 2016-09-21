# w2d
##wide domain delegation for Google Apps Script  

### Demo:

> **demo.gs**

```
function getFiles() {
  var user = "user@domain.ext";
  var scopes = ["https://www.googleapis.com/auth/drive"];
  var w2d = new w2d(user,scopes,key);
  var wtoken = w2d.getToken();
  Logger.log(wtoken);
  
  var params ={headers: {Authorization:" OAuth "+wtoken.token}};
  
  
  var url = "https://www.googleapis.com/drive/v3/files";
  var decorator = "?key="+wtoken.token;
  var result = UrlFetchApp.fetch(url,params);
  Logger.log(result.getResponseCode());
  Logger.log(result.getContentText());
}
```
this will return you a log like that:  

>[15-12-31 01:01:01:001 PDT] no token getting a new one  
>[15-12-31 01:01:01:002 PDT] {validityTime=1474468973, user=user@domain.ext, token=ya29.someUnreadableToken}  
>[15-12-31 01:01:01:003 PDT] 200.0  
>[15-12-31 01:01:01:004 PDT] {  
> "kind": "drive#fileList",  
> "files": [  
>  {  
>   "kind": "drive#file",  
>   "id": "IdIdIdIdIdIdIdIdIdIdIdId",  
>   "name": "file name",  
>   "mimeType": "application/vnd.google-apps.document"  
>  },  
>  ....  
> ]  
>}  
