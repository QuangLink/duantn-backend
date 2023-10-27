const express = require("express");
const router = express.Router();
const db = require("./../models/database");
const { v1: uuidv1 } = require('uuid');

//post cart to order
router.post("/", (req, res) => {
    try {
        if (req.body && req.body.userID) {
            const userID = req.body.userID;
            const uuid = uuidv1(); // Generate a UUID for the orderCode

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
            res.status(400).json({ error: 'Missing userID in request body' });
        }
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

module.exports = router;
