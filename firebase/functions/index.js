const functions = require('firebase-functions');
var {
  google
} = require('googleapis');
let privatekey = require("./privatekey.json");
let jwtClient = new google.auth.JWT(
  privatekey.client_email,
  null,
  privatekey.private_key,
  ['https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar'
  ]);
authenticate(jwtClient);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//email should be identifier.
exports.pullMemberData = functions.https.onCall((data, context) => {
    authenticate(client);
});

//List of needed Functions for stats
// 1) Pull members/event details from spreadsheets
// 2) Calculate number of active members
// 3) Get statistics data on any person (list of events attended, active status)

//drive api stuff

function authenticate(client) {
  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("Successfully connected to sheets");
      var parentID = "1lCoITNE0eyrRNxKtVhpHe7bq-P0FUp0e";
      loadFiles(jwtClient, parentID);
    }
  });
}

function getSheetData(auth,sheetID){
const sheets = google.sheets({version: 'v4', auth});
//var spreadsheetId = "1sSDRdukNm1UskZ9ivkuJ2hvsX-HhHLEfxO8rszuoqz8";
var request = {
        valueRenderOption: 'FORMATTED_VALUE',
        spreadsheetId:sheetID,
        range:"A:E"
}
sheets.spreadsheets.values.get(request, (err,response) => {
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
        files.forEach((file) => {
          getSheetData(auth,file.id);
        });
    }
  });
}
