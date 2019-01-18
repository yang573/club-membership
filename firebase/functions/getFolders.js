// #!/usr/local/bin/node

var {google} = require('googleapis');
var fs = require('fs');
var async = require('async');
var path = require('path');
let privatekey = require("./privatekey.json");
var parentFolderId = '1AQWuUGVEDLwxmXnUw3JU3pFoKVwhqVWO';
let jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        [
                'https://www.googleapis.com/auth/drive'
        ]);
//authenticate request
jwtClient.authorize(function (err, tokens) {
        if (err) {
                console.log(err);
                return;
        } else {
          var parentID = "NAH";
              checkFile(jwtClient, parentID);
        }

});
function checkFile(auth,parent) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    fields: 'nextPageToken, files(id, name)',
                q: "'"+parent+"' in parents",
  }, (err, res) => {
  //  if (err) console.log('The API returned an error when checking file: ' + err);
  if(err) {
    console.log(err.errors);
    return;
  }
                if (res.data.files==null) {
                        console.log("No files found");
                        return;
                }
    const files = res.data.files;
    if (files.length) {
        console.log(files);
    }
  });
}
