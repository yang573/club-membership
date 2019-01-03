const express = require('express');
const router = express.Router();
const connection = require('./connection');


// Add an event spreadsheet to the database
router.post('/', function(req, res) {
  // // Get data from Google Drive
  // // req.body.PARAM == sheet name/path
  // let eventData = ['Hi', new Date(2018, 8, 30), 100];
  //
  // // Add any new members & newsletter changes
  // // TODO
  //
  // // Get semester
  // let sqlString = `SELECT * FROM Semester WHERE Value LIKE ${} LIMIT 1`;
  // connection.query(sqlString, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // eventData.splice(2, 0, semesterID);
  // });
  //
  // // Post event into Events table
  // sqlString = 'INSERT INTO Events (Name, Date, SemesterID, Attendance)' +
  //   'VALUES (?, ?, ?, ?)';
  // connection.query(sqlString, eventData, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // TODO:
  // });
  //
  // // Link Members to Events
  // // TODO:


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

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
