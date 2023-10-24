const express = require("express");
const router = express.Router();
const db = require("./../models/database");
const { v1: uuidv1 } = require('uuid');

router.get("/", (req, res) => {
    const userID = req.payload.userID; // get userID from payload
    const sql = `SELECT cart.*, users.*, product.*
                             FROM cart
                             LEFT JOIN users ON cart.userID = users.userID
                             LEFT JOIN product ON cart.prodID = product.prodID
                             WHERE cart.userID = ${userID} AND product.prodID = cart.prodID;`;

    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

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

module.exports = router;




module.exports = router;
