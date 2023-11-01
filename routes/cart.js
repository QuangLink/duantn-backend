const express = require("express");
const router = express.Router();
const db = require("./../models/database");
const { authenToken } = require("./middleware");
router.options("/", (req, res) => {
  res.status(200).send("OK");
});
router.get("/", (req, res) => {
  const userID = req.body.userID;
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
//router +1 value in quantity by cartID
router.put("/plus/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE cart SET quantity = quantity + 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
router.put("/minus/:cartID", (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE cart SET quantity = quantity - 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    const sql2 = `SELECT quantity FROM cart WHERE cartID = ${cartID};`;
    db.query(sql2, (err, result2) => {
      if (err) throw err;
      if (result2[0].quantity === 0) {
        const sql3 = `DELETE FROM cart WHERE cartID = ${cartID};`;
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
  const { prodID, userID } = req.body;
  if (!userID) {
    res.status(500).send("Missing userID");
    return;
  }
  const checkSql = `SELECT * FROM cart WHERE prodID = ${prodID} AND userID = ${userID};`;
  db.query(checkSql, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const updateSql = `UPDATE cart SET quantity = quantity + 1 WHERE prodID = ${prodID} AND userID = ${userID};`;
      db.query(updateSql, (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    } else {
      const insertSql = `INSERT INTO cart (prodID, userID, quantity) VALUES (${prodID}, ${userID}, 1);`;
      db.query(insertSql, (err, result) => {
        if (err) throw err;
        res.send(result);
      });
    }
  });
});
//xóa sản phẩm trong giỏ hàng dựa trên prodID
router.delete("/:prodID", (req, res) => {
  const prodID = req.params.prodID;
  const sql = `DELETE FROM cart WHERE prodID = ${prodID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
module.exports = router;
