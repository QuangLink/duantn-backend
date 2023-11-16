const express = require("express");
const router = express.Router();
const db = require("../models/database");
const { v1: uuidv1 } = require("uuid");
const moment = require("moment");
;
let $ = require("jquery");
const request = require("request");

router.post("/create_payment_url", async function (req, res, next) {
  try {
    console.log(req.body);
    if (req.body && req.body.userID) {
      const userID = req.body.userID;
      const uuid = uuidv1(); // Generate a UUID for the orderCode
      console.log(uuid); // Display the UUID in the console
     
      
      // Create a transaction to ensure both operations succeed or fail together
      db.beginTransaction(async (err) => {
        if (err) {
          throw err;
        }

        try {
          // SQL query to insert data into `order`
          const insertSQL = `
            INSERT INTO \`order\` (
              orderCode,
              userID,
              prodID,
              quantity,
              cartID
            )
            SELECT
              "${uuid}",
              ${userID},
              cart.prodID,
              cart.quantity,
              cart.cartID
            FROM cart WHERE cart.userID = ${userID};
          `;

          // SQL query to delete data from `cart`
          const deleteSQL = `DELETE FROM cart WHERE userID = ${userID};`;

          // Execute the insert query
          await db.query(insertSQL);

          // Execute the delete query
          await db.query(deleteSQL);

          // Commit the transaction if both queries succeed
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                throw commitErr;
              });
            }
    
            // Assuming you want to store the orderCode from the results
            const orderCode = uuid; // Adjust this based on your database schema
    
            let date = new Date();
            let createDate = moment(date).format("YYYYMMDDHHmmss");
            let orderId = moment(date).format("DDHHmmss");
    
            let ipAddr =
            req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    
          let config = require("config");
    
          let tmnCode = config.get("vnp_TmnCode");
          let secretKey = config.get("vnp_HashSecret");
          let vnpUrl = config.get("vnp_Url");
          let returnUrl = config.get("vnp_ReturnUrl");
          let amount = req.body.amount;
          let bankCode = req.body.bankCode;
    
          let locale = req.body.language;
          if (locale === null || locale === "") {
            locale = "vn";
          }
          let currCode = "VND";
          let vnp_Params = {};
          vnp_Params["vnp_Version"] = "2.1.0";
          vnp_Params["vnp_Command"] = "pay";
          vnp_Params["vnp_TmnCode"] = tmnCode;
          vnp_Params["vnp_Locale"] = locale;
          vnp_Params["vnp_CurrCode"] = currCode;
          vnp_Params["vnp_TxnRef"] = orderId;
          vnp_Params["vnp_OrderInfo"] = orderCode;
          vnp_Params["vnp_OrderType"] = "other";
          vnp_Params["vnp_Amount"] = amount * 100;
          vnp_Params["vnp_ReturnUrl"] = returnUrl;
          vnp_Params["vnp_IpAddr"] = ipAddr;
          vnp_Params["vnp_CreateDate"] = createDate;
          if (bankCode !== null && bankCode !== "") {
            vnp_Params["vnp_BankCode"] = bankCode;
          }
    
          vnp_Params = sortObject(vnp_Params);
    
          let querystring = require("qs");
          let signData = querystring.stringify(vnp_Params, { encode: false });
          let crypto = require("crypto");
          let hmac = crypto.createHmac("sha512", secretKey);
          let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
          vnp_Params["vnp_SecureHash"] = signed;
          vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
    
          // You can use orderCode as needed in the rest of your logic
    
            res.send(vnpUrl);
          });
        } catch (queryErr) {
          await db.rollback();
          throw queryErr;
        }
      });
    } else {
      res.status(400).json({ error: "Missing userID in request body" });
    }
  } catch (error) {
    console.error("Error creating payment URL:", error);
    res.status(500).send("Internal Server Error");
  }
});

//post cart to order
router.post("/", (req, res) => {
  try {
    if (req.body && req.body.userID) {
      const userID = req.body.userID;
      const uuid = uuidv1(); // Generate a UUID for the orderCode
      console.log(uuid); // Display the UUID in the console

      // Create a transaction to ensure both operations succeed or fail together
      db.beginTransaction((err) => {
        if (err) {
          throw err;
        }

        // SQL query to insert data into `order`
        const insertSQL = `INSERT INTO \`order\` (
                    orderCode,
                    userID,
                    prodID,
                    quantity,
                    cartID
                )
                SELECT
                    "${uuid}",
                    ${userID},
                    cart.prodID,
                    cart.quantity,
                    cart.cartID
                FROM cart WHERE cart.userID = ${userID};`;

        // SQL query to delete data from `cart`
        const deleteSQL = `DELETE FROM cart
                WHERE userID = ${userID};`;

        // Execute the insert query
        db.query(insertSQL, (err, result) => {
          if (err) {
            return db.rollback(() => {
              throw err;
            });
          }

          // Execute the delete query
          db.query(deleteSQL, (err, result) => {
            if (err) {
              return db.rollback(() => {
                throw err;
              });
            }

            // Commit the transaction if both queries succeed
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  throw err;
                });
              }

              res.send(result);
            });
          });
        });
      });
    } else {
      res.status(400).json({ error: "Missing userID in request body" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get all order by orderCode
router.get("/", (req, res) => {
  const sql = `SELECT \`order\`.*, product.*, users.*
                 FROM \`order\`
                 LEFT JOIN product ON \`order\`.prodID = product.prodID
                 LEFT JOIN users ON \`order\`.userID = users.userID
                 ORDER BY orderCode;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
//get all order by userID
router.get("/user/:userID", (req, res) => {
  const userID = req.params.userID;
  const sql = `SELECT \`order\`.*, product.*, users.*
                 FROM \`order\`
                 LEFT JOIN product ON \`order\`.prodID = product.prodID
                 LEFT JOIN users ON \`order\`.userID = users.userID
                 WHERE \`order\`.userID = ${userID}
                 ORDER BY orderCode;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
//get order by orderCode
router.get("/:orderCode", (req, res) => {
  const orderCode = req.params.orderCode;
  const sql = `SELECT \`order\`.*, product.*, users.*
                 FROM \`order\`
                 LEFT JOIN product ON \`order\`.prodID = product.prodID
                 LEFT JOIN users ON \`order\`.userID = users.userID
                 WHERE orderCode = "${orderCode}";`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
// add delete order by orderCode
router.delete("/", (req, res) => {
  const orderCode = req.params.orderCode;
  const sql = `DELETE FROM \`order\` WHERE orderCode = "${orderCode}";`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = router;
