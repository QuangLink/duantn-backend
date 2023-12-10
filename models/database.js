var mysql = require('mysql');
require('dotenv').config();
var db = mysql.createConnection({
   host: "database-1.cvopmbfugv3f.ap-southeast-2.rds.amazonaws.com",
   user:"jaguarshop",
   password: "jaguarshop",
   database: "duantn",
}); 
db.connect(() => console.log('Da ket noi database !'));
module.exports = db; 