/*
Copyright 2016 Harold Ousset

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/ 

/**
* PROCESS TO OBTAIN A KEY
Open the google console
https://console.developers.google.com
open a project Or create a new project
Activate teh desired API
Go to the id tab
Fill the informations in the 2d tab authorisation screen (name the app)
Create some ID (Service account) (select "other")
Save the JSON (that's what we call jsonkey here)
Modify the created Id (3 dot at the right of the line)
Activate delegation at the Domain level
Open the admin console and go to the managed clients https://admin.google.com/AdminHome?chromeless=1#OGX:ManageOauthClients
enter the ID of the service account and the scope of interest
DONE !
**/

/**
* Function that obtain a Token
* @param {String} user for witch we want the dbl oauth
* @param {Array} Scopes, the list of the scopes needed
* @param {String} JSON_Key, the key obtained from teh wide domain process stringifyed
* @return {String} token to use
**/
function w2d(user,scopes,jsonKey) {
  this.token = {};
  this.scopes = scopes ||["https://www.googleapis.com/auth/calendar"]; // demo scope
  var aud = "https://www.googleapis.com/oauth2/v4/token";
  var iss = jsonKey.client_email;
  this.sub = user;
  var iat = (Date.now()/1000).toString().substr(0,10); // Date.now() == Date().getTime()
  var exp = (parseInt(iat) + 3600).toString().substr(0,10);
  
  var encoded_header = Utilities.base64Encode('{"alg":"RS256","typ":"JWT"}');
  var claim = {
    "iss":iss,
    "sub":this.sub,
    "scope":this.scopes.join(' '),
    "aud":aud,
    "exp":exp,
    "iat":iat
  };
  var encoded_claim = Utilities.base64Encode(JSON.stringify(claim), Utilities.Charset.UTF_8);
  
  var sign = Utilities.computeRsaSha256Signature((encoded_header+"."+encoded_claim), jsonKey.private_key, Utilities.Charset.UTF_8);
  var encoded_signature = Utilities.base64Encode(sign);

  var assertion = encoded_header+"."+encoded_claim+"."+encoded_signature;
  
  var payload = {
    "grant_type":"urn:ietf:params:oauth:grant-type:jwt-bearer",
    "assertion":assertion
  };
  var params = {
    "payload":payload,
    "method":"post",
    "muteHttpExceptions":true
  };
  
  this.generateToken = function(){
  var response = UrlFetchApp.fetch(aud, params);
  var respObj = JSON.parse(response.getContentText());
  if(response.getResponseCode()!=200 || respObj=="invalid_grant"){
    throw "Authentication failed ("+response.getResponseCode()+"): "+ response.getContentText();
  }
  this.token = {"token":respObj.access_token,"user":this.sub,"validityTime":exp};
    return this.token;
  };
  
  this.getToken = function(){
    if(this.token.token===undefined){
      Logger.log("no token getting a new one");
      return this.generateToken();
    }
    if(Number(this.token.validityTime)<(Number((Date.now()/1000).toString().substr(0,10))-10)){
      Logger.log("token out of date getting a new one");
      return this.generateToken();
    }
    Logger.log("getting actual token");
    return this.token;
  };
}
