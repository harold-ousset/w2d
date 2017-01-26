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

/**
* get the owned calendars for a user
* @param {String} user, email of the user
* @param {String} pageToken, page token if there is one
* @param {String} token, a valid access token for the user and scope
* @return {Object}, {nextPageToken, items[{id,summary}]}
**/
function getCalendars(user, pageToken, token) {
  // API page: https://developers.google.com/google-apps/calendar/v3/reference/calendarList/list
  // scope: https://www.googleapis.com/auth/calendar
  pageToken = pageToken || '';
  var params = {
    contentType: 'application/json',
    headers: {
      Authorization: ' OAuth ' + token,
    },
    muteHttpExceptions: true,
  };

  var url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList' +
    '?minAccessRole=owner&fields=items(id,summary),nextPageToken';
  if (pageToken !== '') {
    url += '&pageToken=' + encodeURIComponent(pageToken);
  }

  var result = fetchUrlFailProof(url, params);
  var obj = JSON.parse(result.getContentText());
  return obj;
}

function getMailList(token) {
  // https://developers.google.com/gmail/api/v1/reference/users/getProfile
  var url = 'https://www.googleapis.com/gmail/v1/users/me/profile';
  var params = { contentType: 'application/json',
    headers: { Authorization: ' OAuth ' + token }, muteHttpExceptions: true, };
  var result = fetchUrlFailProof(url, params);
  return JSON.parse(result).threadsTotal; // messagesTotal
}

function getPop(token) {
  // https://developers.google.com/gmail/api/v1/reference/users/settings/pop
  var url = 'https://www.googleapis.com/gmail/v1/users/me/settings/pop';
  var params = { contentType: 'application/json',
    headers: { Authorization: ' OAuth ' + token }, muteHttpExceptions: true, };
  var result = fetchUrlFailProof(url, params);
  return JSON.parse(result).accessWindow;
}

function getImap(token) {
  // https://developers.google.com/gmail/api/v1/reference/users/settings/getImap
  var url = 'https://www.googleapis.com/gmail/v1/users/me/settings/imap';
  var params = { contentType: 'application/json',
    headers: { Authorization: ' OAuth ' + token }, muteHttpExceptions: true, };
  var result = fetchUrlFailProof(url, params);
  return JSON.parse(result).enabled;
}

function getForwardingAddresses(token) {
  // https://developers.google.com/gmail/api/v1/reference/users/settings/forwardingAddresses/list
  var url = 'https://www.googleapis.com/gmail/v1/users/me/settings/forwardingAddresses';
  var params = { contentType: 'application/json',
    headers: { Authorization: ' OAuth ' + token }, muteHttpExceptions: true, };
  var result = fetchUrlFailProof(url, params);
  var obj = JSON.parse(result);
  if (obj.forwardingAddresses) {
    return obj.forwardingAddresses.map(
      function (fow) {
        return fow.forwardingEmail;
      }
    );
  }

  return [];
}

function getMails(user, token, q) {
  // https://www.googleapis.com/gmail/v1/users/userId/messages
  /**
  * retrieve the subject of the conversation
  * @param {String} id, id of the conversation
  * @param {String} token, a valid token to make this request
  * @return {String} subject, the subject of the first mail in the conversation
  **/
  function getSubject(id, token) {
    var url = 'https://www.googleapis.com/gmail/v1/users/me/threads/' + id;
    url += '?fields=messages/payload/headers';
    var params = { contentType: 'application/json',
      headers: { Authorization: ' OAuth ' + token }, muteHttpExceptions: true, };
    var result = fetchUrlFailProof(url, params);
    var obj = JSON.parse(result);
    return obj.messages[0].payload.headers.reduce(
      function (out, head) {
        if (head.name == 'Subject') {out = head.value;}

        return out;
      },

      '');
  }

  q = q || '';
  var pageToken = '';

  var params = {
    contentType: 'application/json',
    headers:  { Authorization: ' OAuth ' + token },
    muteHttpExceptions: true,
  };

  var mailCount = 0;
  do {
    var url = 'https://www.googleapis.com/gmail/v1/users/me/threads';
    url += '?fields=nextPageToken,threads/id';
    url += q !== '' ? '&q=' + encodeURIComponent(q) : '';
    url += pageToken !== '' ? '&pageToken=' + encodeURIComponent(pageToken) : '';
    var result = fetchUrlFailProof(url, params);
    var obj = JSON.parse(result);
    pageToken = obj.nextPageToken;
    mailCount += obj.threads.length;

    //Logger.log(mailCount);
    //obj.threads.map(
    //  function (thread){
    //    return getSubject(thread.id,wtoken.token);
    //  }
    //);
  }
  while (pageToken && pageToken !== '' && mailCount < 2000);
  return mailCount;
}

/**
* fetch a url with exponential backoff
* @param {String} url, url to fetch
* @parma {Object} params, parameters to provide to the urlFetch
* @return {String} the content text of the return
**/
function fetchUrlFailProof(url, params){
  var result;
  for (var i = 0; i < 6; i++) {
    try {
      result = UrlFetchApp.fetch(url, params);
      if(result.getResponseCode() == 200) {
       break; 
      }

    }
    catch(err){
      //Logger.log(i + err);
    }
    if (i < 5 ) {
      //Logger.log("going to sleep a little");
      Utilities.sleep((Math.pow(2,i)*1000) + (Math.round(Math.random() * 1000)));
    }
  }
  if(result.getResponseCode() == 200){
    return result.getContentText(); 
  }
  console.log('Going to fail with result code: ' + result.getResponseCode() + 'and response: ' + result.getContentText());
  console.log(url);
  console.log(params);
  throw {name:'miserably failed to fetch url ' + url, message:JSON.stringify(params)};
}
