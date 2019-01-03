const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  // TODO: Change the below to an ssl certificate
  user: 'NodeJS',
  password: 'Augmented59Shirts', // HACK: This should not be hardcoded you doofus
  database: 'dev_sbcs'
});

connection.connect(function(error) {
  if (error) {
    throw error;
  }
});

console.log('connection');

function promiseQuery(query, values = null) {
  return new Promise(function(resolve, reject) {
    connection.query(query, values, function(error, results) {
      if (error != null)
        reject(error);
      else
        resolve(results);
    });
  });
}

module.exports = {
  connection: connection,
  promiseQuery: promiseQuery
};
