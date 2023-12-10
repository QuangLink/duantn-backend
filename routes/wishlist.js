const express = require("express");
const router = express.Router();
const db = require("../models/database");
const { authenToken } = require("./middleware");

// OPTIONS route
router.options("/", (req, res) => {
  res.status(200).send("OK");
});

// POST route for adding a product to the wishlist
router.post("/", authenToken, (req, res, next) => {
  const { userID, prodID, colorID, storageID } = req.body;

  const checkDuplicateQuery =
    "SELECT * FROM wishlist WHERE userID = ? AND prodID = ? AND colorID = ? AND storageID = ?";
  db.query(
    checkDuplicateQuery,
    [userID, prodID, colorID, storageID],
    (error, results) => {
      if (error) {
        next(error);
      } else if (results.length > 0) {
        res.status(400).send("Product already in wishlist");
      } else {
        const insertQuery = `INSERT INTO wishlist (userID, prodID, colorID, storageID) VALUES (?, ?, ?, ?)`;
        db.query(
          insertQuery,
          [userID, prodID, colorID, storageID],
          (err, result) => {
            if (err) {
              next(err);
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

// GET route for retrieving the wishlist for a specific user
router.get("/:userID", authenToken, (req, res, next) => {
  const { userID } = req.params;

  const getUserQuery = `SELECT * FROM wishlist WHERE userID = ?`;
  const getProductQuery = `
    SELECT *,
    COALESCE(product_entry.prodPrice, product.prodPrice) as prodPrice,
    COALESCE(product_entry.prodID, product.prodID) as prodID,
    COALESCE(product_entry.prodImg, product.prodImg) as prodImg,
    COALESCE(product_entry.QTY, product.QTY) as QTY,
    COALESCE(
      (COALESCE(product_entry.prodPrice, product.prodPrice) + 
      (COALESCE(product_entry.prodPrice, product.prodPrice) * product.prodSale / 100)),
      COALESCE(product_entry.prodPrice, product.prodPrice)
    ) AS prodPriceSale
    FROM product
    LEFT JOIN product_entry 
      ON product.prodID = product_entry.prodID
      AND (product_entry.colorID IS NULL OR product_entry.colorID = product_entry.colorID) 
      AND (product_entry.storageID IS NULL OR product_entry.storageID = product_entry.storageID
          OR (product_entry.storageID IS NULL AND product_entry.storageID IS NULL))
    LEFT JOIN color ON product_entry.colorID = color.colorID
    LEFT JOIN storage ON product_entry.storageID = storage.storageID
    LEFT JOIN ram ON product_entry.ramID = ram.ramID
    WHERE product.prodID IN (${getUserQuery})`;

  db.query(getProductQuery, [userID], (err, result) => {
    if (err) {
      next(err);
    } else {
      res.send(result);
    }
  });
});

// DELETE route for deleting a product from the wishlist
router.delete("/", authenToken, (req, res, next) => {
  const { userID, prodID, colorID, storageID } = req.body;

  const deleteQuery = `
    DELETE FROM wishlist 
    WHERE prodID = ? 
      AND userID = ? 
      AND (colorID = ? OR (colorID IS NULL AND ? IS NULL)) 
      AND (storageID = ? OR (storageID IS NULL AND ? IS NULL))
  `;

  db.query(
    deleteQuery,
    [prodID, userID, storageID, storageID, colorID, colorID],
    (err, result) => {
      if (err) {
        console.error("Error deleting from wishlist:", err);
        next(err);
      } else {
        res.send(result);
      }
    }
  );
});

module.exports = router;
