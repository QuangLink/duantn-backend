const express = require("express");
const router = express.Router();
const db = require("../models/database");
const { authenToken } = require("./middleware");
router.options("/", (req, res) => {
  res.status(200).send("OK");
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
//router +1 value in quantity by cartID
router.put("/plus/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE cart SET quantity = quantity + 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
// router set value in quantity by cartID
router.put("/set/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const { quantity } = req.body;
  const sql = `UPDATE cart SET quantity = ${quantity} WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
router.put("/minus/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE wishlist SET quantity = quantity - 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    const sql2 = `SELECT quantity FROM wishlist WHERE cartID = ${cartID};`;
    db.query(sql2, (err, result2) => {
      if (err) throw err;
      if (result2[0].quantity === 0) {
        const sql3 = `DELETE FROM wishlist WHERE cartID = ${cartID};`;
        db.query(sql3, (err, result3) => {
          if (err) throw err;
          res.send(result3);
        });
      } else {
        res.send(result);
      }
    });
  });
});
//thêm sản phẩm vào giỏ hàng dựa trên prodID và userID
router.post("/", (req, res) => {
  const { prodID, userID, colorID, storageID } = req.body;
  console.log(req.body);
  if (!userID) {
    res.status(400).send("Missing userID");
    return;
  }
  const checkSql = `SELECT * FROM wishlist WHERE prodID = ${prodID} AND userID = ${userID} AND colorID = ${colorID || 'NULL'} AND storageID = ${storageID || 'NULL'};`;
  db.query(checkSql, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const updateSql = `UPDATE wishlist 
      SET quantity = quantity + 1 
      WHERE prodID = ${prodID} AND userID = ${userID} AND colorID = ${colorID || 'NULL'} AND storageID = ${storageID || 'NULL'};`;
      db.query(updateSql, (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    } else {
      const insertSql = `INSERT INTO wishlist (prodID, userID,colorID,storageID, quantity) VALUES (${prodID}, ${userID},${colorID || 'NULL'},${storageID || 'NULL'}, 1);`;
      db.query(insertSql, (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    }
  });
});
//xóa sản phẩm trong giỏ hàng dựa trên prodID
router.delete("/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const sql = `DELETE FROM cart WHERE cartID = ${cartID} ;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
module.exports = router;
