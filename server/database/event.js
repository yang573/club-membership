const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsPromises = fs.promises;
const {google} = require('googleapis');
const parse = require('csv-parse/lib/sync');
const connection = require('./connection');

const upload = multer({ dest: 'upload/'});
const router = express.Router();


// Add an event spreadsheet to the database
// TODO: Change to csv parse into stream
// TODO: Check for duplicate log-ins (with hashset)
// TODO: Pass headers to insertMemberFromEvent()
// TODO: Change semester determination to date. Add date cutoff to Semester table
// TODO: Add more options through req.body
router.post('/upload/csv', upload.single('file'), (req, res) => {
  let header;
  let data;
  let membersPresent = [];
  let message = {
    EventID: -1,
    Attendance: 0,
    Number_Returning: 0,
    Number_New: 0,
    Delete_Temp_File: false
  };

  // Read the uploaded file.
  fsPromises.readFile(req.file.path, { encoding: 'ascii' }).then(result => {
    // Get spreadsheet headers and data
    try {
      header = parse(result, { to: 1, trim: true });
      data = parse(result, { from: 2, trim: true });
    } catch (error) {
      return res.send(connection.parseError(error));
    }

    // console.log('Header and data parsed');
    // console.log(header);
    // console.log(data);
    message.Attendance = data.length;

    // Creates/updates members based on spreadsheet.
    let promiseArray = [];
    data.forEach(entry => {
      promiseArray.push(insertMemberFromEvent(entry));
    });

    return Promise.all(promiseArray);
  }).then(results => {
    // Gets the number of new and returning members.
    results.forEach(member => {
      membersPresent.push(member.memberID);

      if (member.returning)
        message.Number_Returning += 1;
      else
        message.Number_New += 1;
    });

    // TODO: Change
    // Gets the SemesterID based on specified semester
    // or most recent semester if not specified.
    if (req.body.semester) {
      return connection.promiseQuery('SELECT * FROM semester WHERE Value = ?', req.body.semester);
    } else {
      return connection.promiseQuery('SELECT * FROM semester ORDER BY SemesterID DESC LIMIT 1');
    }
  }).then(result => {
    // TODO: Get name and date directly from file
    // Inserts the event into the database.
    return connection.promiseQuery(
      'INSERT INTO events (Name, Date, SemesterID, Attendance) VALUES (?, ?, ?, ?)',
      [req.body.eventName, req.body.eventDate, result[0].SemesterID, data.length]
    );
  }).then(result => {
    message.EventID = result.insertId;

    // Inserts the member-event assignments into the database.
    let promiseArray = [];
    membersPresent.forEach(memberID => {
      promiseArray.push(
        connection.promiseQuery(
          'INSERT INTO member_event (MemberID, EventID) VALUE (?,?)',
          [memberID, result.insertId]
        )
      );
    });

    return Promise.all(promiseArray);
  }).then(() => {
    // Deletes the uploaded file and returns basic stats about the event.
    message.Delete_Temp_File = deleteFile(req.file.path);
    return res.send(connection.packageData(message));
  }).catch(error => {
    // Deletes the uploaded file and returns any error.
    error.deleteFile = deleteFile(req.file.path);
    return res.send(connection.parseError(error));
  });
});

// Add an event spreadsheet to the database
router.post('/upload/drive', (req, res) => {
  googleAuth().catch(error => {
    console.log(error);
    error.code = error.status;
    return res.send(parseError(error));
  });
  return res.send(packageData('done'));
});

// Get overall event info for the most recent semester
// TODO: Get list of events
router.get('/', (req, res) => {
  // select row with max SemesterID
  let overallData;
  connection.promiseQuery('SELECT * FROM semester ORDER BY SemesterID DESC LIMIT 1')
    .then(result => {
    if (result.length === 0) {
      let error = new Error('No events could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    overallData = {
      Semester: result[0].Value,
      Number_Of_Events: null,
      Average_Attendance: null
    };

    return connection.promiseQuery(
      'SELECT * FROM events WHERE SemesterID = ?',
      result[0].SemesterID
    );
  }).then(results => {
    let average = 0;
    results.forEach(row => {
      average += row.Attendance;
    });
    average /= results[0].length;

    overallData.Number_Of_Events = results.length;
    overallData.Average_Attendance = average;

    return res.send(connection.packageData(overallData));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Get information about a specific event
router.get('/:eventID', (req, res) => {
  let eventData;

  connection.promiseQuery(
    'SELECT * FROM events WHERE EventID = ? LIMIT 1',
    req.params.eventID
  ).then(result => {
    if (result.length === 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    eventData = {
      EventID: result[0].EventID,
      Name: result[0].Name,
      Date: result[0].Date,
      Semester: null,
      Attendance: result[0].Attendance
    };

    return connection.promiseQuery(
      'SELECT * FROM semester AS Value WHERE SemesterID = ? LIMIT 1',
      result[0].SemesterID
    );
  }).then(result => {
    eventData.Semester = result[0].Value;
    return res.send(connection.packageData(eventData));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Modify a specified event
router.patch('/:eventID', (req, res) => {
  let values = req.body.values; // JSON

  connection.promiseQuery(
    'SELECT 1 FROM events WHERE EventID = ?',
    req.params.eventID
  ).then(result => {
    if (result.length === 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    // TODO: Check if toSqlString() is needed for the bottom to work
    return connection.promiseQuery(
      'UPDATE events SET ? WHERE EventID = ?',
      [values, req.params.eventID]
    );
  }).then(result => {
    let message = {
      eventID: req.params.eventID,
      affectedRows: result.affectedRows,
      entryChanged: Boolean(result.changedRows)
    };
    return res.send(connection.packageData(message));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Delete the specified event from the database
router.delete('/:eventID', (req, res) => {
  connection.promiseQuery(
    'SELECT 1 FROM events WHERE EventID = ?',
    req.params.eventID
  ).then(result => {
    if (result.length === 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    return connection.promiseQuery('DELETE FROM member_event WHERE EventID = ?', req.params.eventID);
  }).then(result => {
    console.log(result);
    return connection.promiseQuery('DELETE FROM events WHERE EventID = ?', req.params.eventID);
  }).then(result => {
    console.log(result);
    let message = {
      message: 'Deletion successful',
      eventID: req.params.eventID
    };
    return res.send(connection.packageData(message));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

module.exports = router;

async function googleAuth() {
  const auth = await google.auth.getClient({
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });

  const project = await google.auth.getProjectId();
  const url = `https://www.googleapis.com/dns/v1/projects/${project}`;
  const res = await client.request({ url });
  console.log(res.data);
}

// TODO: Parse member data based on headers
async function insertMemberFromEvent(member) {
  let memberID = -1;
  let sqlString;
  let values;
  let emailRegex = /([A-Z0-9_.+-]+@[A-Z0-9-]+\.[A-Z0-9-]+\.[A-Z0-9-.]+)/i;
  console.log(member);

  if (emailRegex.test(member[4])) {
    sqlString = 'SELECT MemberID FROM members WHERE Email = ?';
    values = [member[4]];
  } else {
    sqlString = 'SELECT MemberID FROM members WHERE FirstName = ? AND LastName = ?';
    values = [member[1], member[2]];
  }

  connection.promiseQuery(sqlString, values).then(result => {
    let promiseArray = [
      connection.promiseQuery('SELECT * FROM academic_year WHERE Value LIKE ?', member[3]),
      (result.length !== 0) ? Promise.resolve(result[0].MemberID) : Promise.resolve(null)
    ];
    return Promise.all(promiseArray);
  }).then(results => {
    console.log(results);
    let sqlString;
    let memberData;
    let newsletter = /no/i.test(member[5]) ? false : true;

    if (results[1]) {
      memberID = results[1];
      sqlString = 'UPDATE members SET ? WHERE MemberID = ?';
      memberData = [
        {
          YearID: results[0][0].MemberID,
          Newsletter: newsletter
        },
        memberID
      ];
    } else {
      sqlString = `INSERT INTO members (FirstName, LastName, YearID, Email, Newsletter)
                        VALUES (?, ?, ?, ?, ?)`;
      memberData = [
        member[1], member[2],
        results[0][0].YearID, member[4].trim(), newsletter
      ];
    }

    return connection.promiseQuery(sqlString, memberData);
  }).then(result => {
    console.log(result);
    let isReturning = true;
    if (memberID === -1) {
      memberID = result.insertId;
      isReturning = false;
    }

    let message = {
      memberID: memberID,
      returning: isReturning,
      affectedRows: result.affectedRows,
      entryChanged: Boolean(result.changedRows)
    };
    return Promise.resolve(message);
  }).catch(error => {
    return Promise.reject(error);
  });
}

function deleteFile(filePath) {
  fsPromises.unlink(filePath).then(() => {
    return { success: true };
  }).catch(error => {
    return { success: false, error: error };
  });
}
