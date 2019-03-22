const express = require('express');
const router = express.Router();
const connection = require('./connection');

// Insert a new member
router.post('/', (req, res) => {
  console.log('req.body');
  console.log(req.body);
  console.log('end');
  connection.promiseQuery(
    `SELECT 1 FROM members WHERE Email = ?`,
    req.body.email
  ).then(result => {
    console.log(result);
    console.log('length');
    console.log(result.length);
    if (result.length !== 0) {
      let error = new Error('A member already exists with the email '+ req.body.email);
      error.code = 404;
      return Promise.reject(error);
    }

    let sqlString = `INSERT INTO members (FirstName, LastName, YearID, Email, Newsletter)
                      VALUES (?, ?, ?, ?, ?)`;
    let memberData = [
      req.body.firstName, req.body.lastName,
      req.body.yearID, req.body.email, req.body.newsletter
    ];

    return connection.promiseQuery(sqlString, memberData);
  }).then(result => {
    console.log(result);
    let insertData = {
      memberID: result.insertId,
      url: `/member/${result.insertId}`
    };

    return res.send(connection.packageData(insertData));
  }).catch(error => {
    res.send(connection.parseError(error));
  });
});

// Get overall membership information
// TODO: Paginate list of memberID
router.get('/', (req, res) => {
  let memberData;
  let promiseArray = [
    connection.promiseQuery('SELECT COUNT(*) AS count FROM members'),
    connection.promiseQuery(`SELECT ROUND(AVG(Semester_Attendance), 2) AS semester_average,
      ROUND(AVG(Total_Attendance), 2) AS total_average
      FROM membership`),
    connection.promiseQuery('SELECT Active, COUNT(*) AS count FROM membership GROUP BY Active'),
  ];

  Promise.all(promiseArray).then(results => {
    console.log(results);

    memberData = {
      overall: {
        total_members: results[0][0].count,
        average_semester_attendance: results[1][0].semester_average,
        total_semester_attendance: results[1][0].total_average,
        active_members: results[2][0].count
      }
    };

    promiseArray = [
      connection.promiseQuery('SELECT YearID, COUNT(*) AS count FROM members GROUP BY YearID'),
      connection.promiseQuery(`SELECT YearID,
        ROUND(AVG(Semester_Attendance), 2) AS semester_average,
        ROUND(AVG(Total_Attendance), 2) AS total_average
        FROM membership GROUP BY YearID`),
      connection.promiseQuery(`SELECT YearID, Active, COUNT(*) AS count
        FROM membership GROUP BY YearID, Active`),
    ];
    return Promise.all(promiseArray);
  }).then(results => {
    console.log(results);

    memberData.year_breakdown = {
      total_members: yearBreakdown(results[0], 'count'),
      average_semester_attendance: yearBreakdown(results[1], 'semester_average'),
      total_semester_attendance: yearBreakdown(results[1], 'total_average'),
      active_members: yearBreakdown(results[2], 'count')
    };

    return connection.promiseQuery('SELECT MemberID, FirstName, LastName FROM members');
  }).then(results => {
    console.log(results);

    let members = {};
    results.forEach(row => {
      let key = row.FirstName + '_' + row.LastName;
      members[key] = `/database/member/${row.MemberID}`;
    });

    memberData.members = members;

    return res.send(connection.packageData(memberData));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Get information about a specific member
router.get('/:memberID', (req, res) => {
  let memberData;
  let promiseArray = [
    connection.promiseQuery('SELECT * FROM members WHERE MemberID = ? LIMIT 1', req.params.memberID),
    connection.promiseQuery('SELECT * FROM membership WHERE MemberID = ? LIMIT 1', req.params.memberID)
  ];

  Promise.all(promiseArray).then(results => {
    if (results[0].length === 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    memberData = {
      MemberID: results[0][0].MemberID,
      FirstName: results[0][0].FirstName,
      LastName: results[0][0].LastName,
      Year: null,
      Email: results[0][0].Email,
      Newsletter: Boolean(results[0][0].Newsletter),
      Semester_Attendance: results[1][0].Semester_Attendance,
      Total_Attendance: results[1][0].Total_Attendance,
      Active: Boolean(results[1][0].Active)
    };

    return connection.promiseQuery(
      'SELECT * FROM Academic_Year AS Value WHERE YearID = ? LIMIT 1',
      results[0][0].YearID
    );
  }).then(result => {
    console.log(result);
    memberData.Year = result[0].Value;
    return res.send(connection.packageData(memberData));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Modify a specified member
router.patch('/:memberID', (req, res) => {
  let values = req.body.values; // JSON
  connection.promiseQuery(
    'SELECT 1 FROM members WHERE MemberID = ?',
    req.params.memberID
  ).then(result => {
    if (result.length === 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    // TODO: Check if toSqlString() is needed for the bottom to work
    return connection.promiseQuery(
      'UPDATE members SET ? WHERE MemberID = ?',
      [values, req.params.memberID]
    );
  }).then(result => {
    let message = {
      memberID: req.params.memberID,
      affectedRows: result.affectedRows,
      entryChanged: Boolean(result.changedRows)
    };
    return res.send(connection.packageData(message));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Delete the specified member from the database
// TODO: Delete Member refernce in Promos and Member_Login tables
router.delete('/:memberID', (req, res) => {
  connection.promiseQuery(
    'SELECT 1 FROM members WHERE MemberID = ?',
    req.params.memberID
  ).then(result => {
    if (result.length === 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    return connection.promiseQuery(
      'DELETE FROM member_event WHERE MemberID = ?',
      req.params.memberID
    );
  }).then(result => {
    console.log(result);
    return connection.promiseQuery(
      'DELETE FROM members WHERE MemberID = ?',
      req.params.memberID
    );
  }).then(result => {
    console.log(result);
    let message = {
      message: 'Deletion successful',
      memberID: req.params.memberID
    };
    return res.send(connection.packageData(message));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

module.exports = router;

function yearBreakdown(rawData, key) {
	let yearData = Array(8);
	let i = 0;

	for (let j = 0; i < rawData.length; j++) {
    yearData[j] = rawData[i].YearID === j + 1 ? rawData[i++][key] : 0;
  }

	return {
		freshmen: yearData[0],
		sophomore: yearData[1],
		junior: yearData[2],
		senior: yearData[3],
		graduate_student: yearData[4],
		professor: yearData[5],
    company_rep: yearData[6],
		other: yearData[7],
	};
}
