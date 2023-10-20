const express = require('express');
const router = express.Router();
const db = require('./../models/database');
const { authenToken } = require('./middleware');
router.options('/', (req, res) => {
  res.status(200).send('OK');
});
router.get('/',authenToken, (req, res) => {
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
//router +1 value in quantity by cartID
router.put('/plus/:cartID', (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE cart SET quantity = quantity + 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
router.put('/minus/:cartID', (req, res) => {
  const cartID = req.params.cartID;
  const sql = `UPDATE cart SET quantity = quantity - 1 WHERE cartID = ${cartID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
//thêm sản phẩm vào giỏ hàng dựa trên prodID và userID
router.post('/', (req, res) => {
  const { prodID, userID } = req.body;
  const sql = `INSERT INTO cart (prodID, userID) VALUES (${prodID}, ${userID});`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
//xóa sản phẩm trong giỏ hàng dựa trên prodID
router.delete('/:prodID', (req, res) => {
  const prodID = req.params.prodID;
  const sql = `DELETE FROM cart WHERE prodID = ${prodID};`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
module.exports = router;
