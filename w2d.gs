/*
Copyright 2018 Harold Ousset

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
Open the google console: https://console.developers.google.com
open a project Or create a new project
Activate the desired API from the API page: https://console.cloud.google.com/apis/dashboard?project=XXXX
Go to the credentials>Oauth consent screen tab: https://console.cloud.google.com/apis/credentials/consent?project=XXXX
Fill "Product name shown to users " and save
From the "credential" tab https://console.cloud.google.com/apis/credentials?project=XXXXX
Create some ID (Service account key) (select "other")
Save the JSON (that's what we will call jsonKey here)
From the part manage service accounts: https://console.cloud.google.com/iam-admin/serviceaccounts?project=XXXXX
Edit the created Service account (click the 3 dot at the right of the line under "Action" - you may need to scroll)
Click "SHOW DOMAIN-WIDE DELEGATION"
Select "Enable G Suite Domain-wide Delegation"
From a new Chrome tab open the Google Admin Console and go to the managed clients https://admin.google.com/AdminHome?chromeless=1#OGX:ManageOauthClients
enter the "Unique ID" of the service account and the scope(s) of interest (the unique ID is not the Key Id --> What have you done Google!)
You are good to go!
**/

/**
* Function that generate an access token for user from the wide delegation
* @param {String} user, email address of the user for witch we want an access token
* @param {Array} Scopes, the list of the scopes needed
* @param {Object} jsonKey, the service account key obtained from the wide domain process
**/
function w2d(user, scopes, jsonKey) {
  this.token = {};
  this.scopes = scopes || ['https://www.googleapis.com/auth/calendar']; // demo scope
  var aud = 'https://www.googleapis.com/oauth2/v4/token';
  var iss = jsonKey.client_email;
  this.sub = user;
  var iat = (Date.now() / 1000).toString().substr(0, 10); // Date.now() == Date().getTime()
  var exp = (parseInt(iat) + 3600).toString().substr(0, 10);

  var encodedHeader = Utilities.base64Encode('{"alg":"RS256","typ":"JWT"}');
  var claim = {
    iss: iss,
    sub: this.sub,
    scope: this.scopes.join(' '),
    aud: aud,
    exp: exp,
    iat: iat,
  };
  var encodedClaim = Utilities.base64Encode(JSON.stringify(claim), Utilities.Charset.UTF_8);

  var sign = Utilities.computeRsaSha256Signature(
    (encodedHeader + '.' + encodedClaim),
    jsonKey.private_key,
    Utilities.Charset.UTF_8
  );
  var encodedSignature = Utilities.base64Encode(sign);

  var assertion = encodedHeader + '.' + encodedClaim + '.' + encodedSignature;

  var payload = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: assertion,
  };
  var params = {
    payload: payload,
    method: 'post',
    muteHttpExceptions: true,
  };

  this.generateToken = function () {
    var response = UrlFetchApp.fetch(aud, params);
    var respObj = JSON.parse(response.getContentText());
    if (response.getResponseCode() != 200 || respObj == 'invalid_grant') {
      throw 'Authentication failed (' +
      response.getResponseCode() + '): ' +
      response.getContentText();
    }

    this.token = { token: respObj.access_token, user: this.sub, validityTime: exp };
    return this.token;
  };

  this.getToken = function () {
    if (this.token.token === undefined) {
      //no token getting a new one
      return this.generateToken();
    }

    if (Number(this.token.validityTime) <
    (Number((Date.now() / 1000).toString().substr(0, 10)) - 10)) {
      //token out of date getting a new one
      return this.generateToken();
    }

    //getting actual token
    return this.token;
  };
}

// a demo json key needed for the wd2
var jsonKey = {
  type: 'service_account',
  project_id: 'project-name',
  private_key_id: '***********',
  private_key: '-----BEGIN PRIVATE KEY-----\n***********\n**********\n-----END PRIVATE KEY-----\n',
  client_email: 'id@project_id.iam.gserviceaccount.com',
  client_id: '***********',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://accounts.google.com/o/oauth2/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/id%40project_id.iam.gserviceaccount.com',
};
