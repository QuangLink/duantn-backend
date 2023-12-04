const express = require("express");
const router = express.Router();
const db = require("../models/database");
const { authenToken } = require("./middleware");
router.options("/", (req, res) => {
  res.status(200).send("OK");
});
router.post("/", (req, res) => {
  const { userID, prodID, colorID, storageID } = req.body;
  const checkDuplicate = "SELECT * FROM wishlist WHERE userID =? AND prodID =? AND colorID =? AND storageID =?";
  db.query(checkDuplicate, [userID, prodID, colorID, storageID], (error, results) => {
    if (error) throw error;
    else if (results.length > 0) {
      res.status(400).send("Product already in wishlist");
    } else {
      const sql = `INSERT INTO wishlist (userID, prodID, colorID, storageID) VALUES (${userID}, ${prodID}, ${colorID}, ${storageID});`;
      db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    }
  });
});
router.get("/:userID", (req, res) => {
  const { userID } = req.params;
  const sql = `SELECT *, 
  COALESCE(product_entry.prodPrice, product.prodPrice) as prodPrice,
  COALESCE(product_entry.prodID, product.prodID) as prodID,
  COALESCE(product_entry.prodImg, product.prodImg) as prodImg,
  COALESCE(product_entry.QTY, product.QTY) as QTY,
  COALESCE(
    (COALESCE(product_entry.prodPrice, product.prodPrice) + 
     (COALESCE(product_entry.prodPrice, product.prodPrice) * product.prodSale / 100)),
    COALESCE(product_entry.prodPrice, product.prodPrice)
    
) AS prodPriceSale
  FROM wishlist
  LEFT JOIN users ON wishlist.userID = users.userID
  LEFT JOIN product ON wishlist.prodID = product.prodID
  LEFT JOIN product_entry 
      ON product.prodID = product_entry.prodID
      AND (wishlist.colorID IS NULL OR wishlist.colorID = product_entry.colorID) 
      AND (wishlist.storageID IS NULL OR wishlist.storageID = product_entry.storageID
          OR (wishlist.storageID IS NULL AND product_entry.storageID IS NULL))
  LEFT JOIN color ON product_entry.colorID = color.colorID
  LEFT JOIN storage ON product_entry.storageID = storage.storageID
  WHERE wishlist.userID = ${userID} 
    AND product.prodID = wishlist.prodID;
  
  `;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

//xóa sản phẩm trong giỏ hàng dựa trên prodID
router.delete("/:userID/:prodID", (req, res) => {
  const { userID, prodID } = req.params;
  const sql = `DELETE FROM wishlist WHERE prodID = ${prodID} AND userID = ${userID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
module.exports = router;
