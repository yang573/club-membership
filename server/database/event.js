const express = require('express');
const multer = require('multer');
const parse = require('csv-parse');
const connection = require('./connection');

const upload = multer();
const router = express.Router();


// Add an event spreadsheet to the database
// TODO: Change to csv parse into stream
// TODO: Check for duplicate log-ins (with hashset)
// TODO: Pass headers to insertMemberFromEvent()
// TODO: Change semester determination to date. Add date cutoff to Semester table
router.post('/', upload.single(), function(req, res) {
  let header;
  let data;
  try {
    header = parse(res.file, { to: 1 });
    data = parse(res.file, { from: 2 });
  } catch (error) {
    res.send(parseError(error));
  }

  let promiseArray = [];
  for (let entry in data) {
    promiseArray.push(insertMemberFromEvent(entry));
  }

  // TODO: Save data from updating Members table
  promiseArray.then(function(result) {
    if (res.body.semester) {
      return connection.promiseQuery('SELECT * FROM Semester WHERE Value = ?', res.body.semester);
    } else {
      return connection.promiseQuery('SELECT * FROM Semester LIMIT 1 ORDER BY SemesterID DESC');
    }
  }).then(function(result) {
    // TODO: Get name and date directly from file
    return connection.promiseQuery(
      'INSERT INTO Events (Name, Date, SemesterID, Attendance) VALUES (?, ?, ?, ?)',
      res.body.eventName, res.body.eventDate, result[0].SemesterID, data.length
    );
  }).then(function(result) {
    console.log(result);
    promiseArray = [];
    for (let entry in data) {
      // TODO: Get MemberIDs
      // TODO: Get EventID from insertion
      // promiseArray.push(
      //   connection.promiseQuery(
      //     'INSERT INTO Member_Event (MemberID, EventID) VALUE (?,?)'
      //   )
      // );
    }

    return promiseArray;
  }).then(function(result) {
    // TODO: Return insertion messages
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get overall event info for the most recent semester
// TODO: Get list of events
router.get('/', function(req, res) {
  // select row with max SemesterID
  let overallData;
  connection.promiseQuery('SELECT * FROM Semester ORDER BY SemesterID DESC LIMIT 1')
    .then(function(result) {
    if (result.length == 0) {
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
      'SELECT * FROM Events WHERE SemesterID = ?',
      result[0].SemesterID
    );
  }).then(function(results) {
    let average = 0;
    for (let row in results) {
      average += row.Attendance;
    }
    average /= results[0].length;

    overallData.Number_Of_Events = results.length;
    overallData.Average_Attendance = average;

    res.send(packageData(overallData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get information about a specific event
router.get('/:eventID', function(req, res) {
  let eventData;

  connection.promiseQuery(
    'SELECT * FROM Events WHERE EventID = ? LIMIT 1',
    req.params.eventID
  ).then(function(result) {
    if (result.length == 0) {
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
      'SELECT * FROM Semester AS Value WHERE SemesterID = ? LIMIT 1',
      result[0].SemesterID
    );
  }).then(function(result) {
    eventData.Semester = result[0].Value;
    res.send(packageData(eventData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Modify a specified event
router.patch('/:eventID', function(req, res) {
  let values = req.body.values; // JSON

  connection.promiseQuery(
    'SELECT 1 FROM Events WHERE EventID = ?',
    req.params.eventID
  ).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    // TODO: Check if toSqlString() is needed for the bottom to work
    return connection.promiseQuery(
      'UPDATE Events SET ? WHERE EventID = ?',
      [values, req.params.eventID]
    );
  }).then(function(result) {
    let message = {
      eventID: req.params.eventID,
      affectedRows: result.affectedRows,
      entryChanged: Boolean(result.changedRows)
    };
    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Delete the specified event from the database
router.delete('/:eventID', function(req, res) {
  connection.promiseQuery(
    'SELECT 1 FROM Events WHERE EventID = ?',
    req.params.eventID
  ).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    return connection.promiseQuery('DELETE FROM Member_Event WHERE EventID = ?', req.params.eventID);
  }).then(function(result) {
    console.log(result);
    return connection.promiseQuery('DELETE FROM Events WHERE EventID = ?', req.params.eventID);
  }).then(function(result) {
    console.log(result);
    let message = {
      message: 'Deletion successful',
      eventID: req.params.eventID
    };
    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

module.exports = router;

// TODO: Parse member data based on headers
function insertMemberFromEvent(member) {
  return new Promise(function(resolve, reject) {
    let sqlString;
    let values;
    let emailRegex = /([A-Z0-9_.+-]+@[A-Z0-9-]+\.[A-Z0-9-]+\.[A-Z0-9-.]+)/i;
    let email = member[4].trim();
    let validEmail = false;

    if (emailRegex.test(email)) {
      validEmail = true;
      sqlString = 'SELECT MemberID FROM Members WHERE Email = ?';
      values = [email];
    } else {
      sqlString = 'SELECT MemberID FROM Members WHERE FirstName = ? AND LastName = ?';
      values = [member[1], member[2]];
    }

    connection.promiseQuery(sqlString, values).then(function(result) {
      let promiseArray = [
        connection.promiseQuery('SELECT * FROM Academic_Year WHERE Value = ?', member[2]),
        (result.length != 0) ? Promise.resolve(result[0].MemberID) : Promise.resolve(null)
      ];

      return promiseArray;
    }).then(function(results) {
      let sqlString;
      let memberData;
      let newsletter = /no/i.test(member[5]) ? false : true;

      if (results[1]) {
          sqlString = 'UPDATE Members SET ? WHERE MemberID = ?';
          memberData = [
            {
              YearID: results[0][0].Value,
              Newsletter: newsletter
            },
            results[1]
          ];
      } else {
        sqlString = `INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
                          VALUES (?, ?, ?, ?, ?)`;
        memberData = [
          member[1], member[2],
          results[0][0].Value, member[4].trim(), newsletter
        ];
      }

      return connection.promiseQuery(sqlString, memberData);
    }).then(function(result) {
      console.log(result);
      let message = {
        memberID: result.MemberID,
        affectedRows: result.affectedRows,
        entryChanged: Boolean(result.changedRows)
      };
      resolve(message);
    }).catch(function(error) {
      reject(error);
    });
  });
}

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
