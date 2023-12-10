var mysql = require('mysql');
require('dotenv').config();
var db = mysql.createConnection({
   host: process.env.HOST,
   user: process.env.USER, 
   password: process.env.PASSWORD, 
   database: process.env.DATABASE,
}); 
db.connect(() => console.log('Da ket noi database !'));
module.exports = db; 