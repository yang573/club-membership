const express = require('express')
const app = express()
const port = 3000
var exports = module.exports = {};
var {google} = require('googleapis');
let privatekey = require("./sensitiveData/privatekey.json");
let driveInfo = require("./sensitiveData/driveInfo.json");

//getSignIn();

function getSignIn() {
  let jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar'
    ]);

  jwtClient.authorize(function(err, tokens) {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("Successfully connected to sheets");
      var parentID = driveInfo.folderID;
      loadFiles(jwtClient, parentID);
    }
  });
}

function getSheetData(auth,sheetID){
const sheets = google.sheets({version: 'v4', auth});
var request = {
        valueRenderOption: 'FORMATTED_VALUE',
        spreadsheetId:sheetID,
        range:"A:E"
}
sheets.spreadsheets.values.get(request, function(err,response){
  if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(response.data.values);
  });
}
function loadFiles(auth,parent) {
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
                if (res.data.files===null) {
                        console.log("No files found");
                        return;
                }
    const files = res.data.files;
    if (files.length) {
        files.forEach(function(file){
          getSheetData(auth,file.id);
        });
    }
  });
}
module.exports.getSheetData = function(){getSignIn()}
