const express = require("express");
const router = express.Router();
const db = require("../models/database");
const { v1: uuidv1 } = require("uuid");
const moment = require("moment");
let $ = require("jquery");
const request = require("request");
const { await } = require("await");
const config = require("config");
router.put("/update-order/:infoID", (req, res) => {
  console.log(req.body);
  console.log(req.params);
  const infoID = req.params.infoID;
  const status = req.body.status;
  const sql = `UPDATE order_info SET orderStatus = '${status}' WHERE infoID = ${infoID}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
router.get("/total", (req, res) => {
  const sql = `SELECT * FROM order_info;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
    const infoID = result[0].infoID;
    console.log(infoID);
  });
});

router.post("/cod", async function (req, res, next) {
  try {
    if (req.body && req.body.userID) {
      const userID = req.body.userID;
      const uuid = uuidv1(); // Generate a UUID for the orderCode
      const amount = req.body.amount;
      // Start a transaction
      db.beginTransaction((err) => {
        if (err) {
          throw err;
        }

        const testSQL = `INSERT INTO \`order_info\` (orderCode, payment, totalPay) VALUES (?, 'COD', ?)`;

        // Insert into order_info
        db.query(testSQL, [uuid, amount], (err, result) => {
          if (err) {
            return db.rollback(() => {
              throw err;
            });
          }

          // Get infoID from the inserted order_info
          const sql = `SELECT infoID FROM order_info WHERE orderCode = ?`;
          db.query(sql, [uuid], (err, result) => {
            if (err) {
              return db.rollback(() => {
                throw err;
              });
            }

            const infoID = result[0].infoID;

            // Insert into order table
            const insertSQL = `
              INSERT INTO \`order\` (
              
                userID,
                addressID,
                prodID,
                quantity,
                colorID,
                storageID,
                payment,
                infoID
              )
              SELECT
         
                ?,
                user_address.addressID,
                cart.prodID,
                cart.quantity,
                cart.colorID,
                cart.storageID,
                'COD',
                ?
              FROM cart
              JOIN user_address ON user_address.userID = cart.userID
              WHERE cart.userID = ?;
            `;

            // Execute the insert query
            db.query(insertSQL, [userID, infoID, userID], (err, result) => {
              if (err) {
                return db.rollback(() => {
                  throw err;
                });
              }

              // Delete from cart
              const deleteSQL = "DELETE FROM cart WHERE userID = ?";
              db.query(deleteSQL, [userID], (err, result) => {
                if (err) {
                  return db.rollback(() => {
                    throw err;
                  });
                }

                // Commit the transaction if all queries succeed
                db.commit((commitErr) => {
                  if (commitErr) {
                    return db.rollback(() => {
                      throw commitErr;
                    });
                  }

                  // Send the orderCode as a response
                  res.send(uuid);
                });
              });
            });
          });
        });
      });
    } else {
      res.status(400).json({ error: "Missing userID in request body" });
    }
  } catch (error) {
    console.error("Error creating COD order:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/create_payment_url", async function (req, res, next) {
  try {
    if (req.body && req.body.userID) {
      const userID = req.body.userID;
      const amount = req.body.amount;
      const uuid = uuidv1(); // Generate a UUID for the orderCode
      console.log(uuid); // Display the UUID in the console

      // Create a transaction to ensure both operations succeed or fail together
      db.beginTransaction((err) => {
        if (err) {
          throw err;
        }

        const testSQL = `INSERT INTO \`order_info\` (orderCode, payment, totalPay) VALUES (?, 'Banking', ?)`;

        // Insert into order_info
        db.query(testSQL, [uuid, amount], (err, result) => {
          if (err) {
            return db.rollback(() => {
              throw err;
            });
          }

          // Get infoID from the inserted order_info
          const sql = `SELECT infoID FROM order_info WHERE orderCode = ?`;
          db.query(sql, [uuid], (err, result) => {
            if (err) {
              return db.rollback(() => {
                throw err;
              });
            }

            const infoID = result[0].infoID;

            // Insert into order table
            const insertSQL = `
              INSERT INTO \`order\` (
              
                userID,
                addressID,
                prodID,
                quantity,
                colorID,
                storageID,
                payment,
                infoID
              )
              SELECT
         
                ?,
                user_address.addressID,
                cart.prodID,
                cart.quantity,
                cart.colorID,
                cart.storageID,
             
                'COD',
                ?
              FROM cart
              JOIN user_address ON user_address.userID = cart.userID
              WHERE cart.userID = ?;
            `;

            // Execute the insert query
            db.query(insertSQL, [userID, infoID, userID], (err, result) => {
              if (err) {
                return db.rollback(() => {
                  throw err;
                });
              }

              // Commit the transaction if all queries succeed
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() => {
                    throw commitErr;
                  });
                }

                // Send the orderCode as a response
                res.send(uuid);
              });
            });
          });
        });
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

//get all order by orderCode
router.get("/", (req, res) => {
  const sql = `SELECT *,
               COALESCE(product_entry.prodPrice, product.prodPrice) AS prodPrice,
               COALESCE(product_entry.prodImg, product.prodImg) AS prodImg,
               COALESCE(product_entry.QTY, product.QTY) AS QTY
               FROM \`order\`
               LEFT JOIN product ON \`order\`.prodID = product.prodID
               LEFT JOIN users ON \`order\`.userID = users.userID
               LEFT JOIN order_info ON \`order\`.infoID = order_info.infoID
               LEFT JOIN product_entry ON \`order\`.prodID = product_entry.prodID AND \`order\`.colorID = product_entry.colorID AND \`order\`.storageID = product_entry.storageID
                LEFT JOIN color ON \`order\`.colorID = color.colorID
                LEFT JOIN storage ON \`order\`.storageID = storage.storageID
               ORDER BY orderCode;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
//get all order by userID
router.get("/user/:userID", (req, res) => {
  const userID = req.params.userID;
  const sql = `SELECT *,
  COALESCE(product_entry.prodPrice, product.prodPrice) AS prodPrice,
  COALESCE(product_entry.prodImg, product.prodImg) AS prodImg,
  COALESCE(product_entry.QTY, product.QTY) AS QTY
  FROM \`order\`
  LEFT JOIN product ON \`order\`.prodID = product.prodID
  LEFT JOIN users ON \`order\`.userID = users.userID
  LEFT JOIN order_info ON \`order\`.infoID = order_info.infoID
  LEFT JOIN product_entry ON \`order\`.prodID = product_entry.prodID AND \`order\`.colorID = product_entry.colorID AND \`order\`.storageID = product_entry.storageID
   LEFT JOIN color ON \`order\`.colorID = color.colorID
   LEFT JOIN storage ON \`order\`.storageID = storage.storageID
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
