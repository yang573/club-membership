const http = require('http');
// const fs = require('fs');
const express = require('express');

// Setup
const db = require('./server/sql-db.js');
const facebook = require('./server/facebook-api.js');
const linkedin = require('./server/linkedin-api.js');
const app = express();

const hostname = '127.0.0.1';
const port = 3000;

// POST Parser Setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routing
app.use('/database', db);
app.use('/facebook', facebook);
app.use('/linkedin', linkedin);

// Catch-all for returning help info
app.get('*', function(req, res) {
  // TODO
});

app.set('port', port);
app.listen(port, () => console.log(`Server running at http://${hostname}:${port}/`));

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/html');
//   res.end('Hello World\n');
// });