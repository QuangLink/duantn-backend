const express = require('express');
const router = express.Router();
const db = require('./../models/database');

// Get products where prodSale is not 0
router.get('/sale', (req, res) => {
    const query = 'SELECT * FROM product WHERE prodSale <> 0'; // Thêm điều kiện WHERE
    db.query(query, (error, results) => {
      if (error) throw error;
      res.json(results);
    });
  });
router.get('/:product', (req, res) => {
  const productParam = req.params.product;
  
  const prodcatIDs = {
      apple: 1,
      samsung: 2,
      oppo: 3,
      xiaomi: 4,
      hp: 5,
      asus: 6,
      lenovo: 7,
      acer: 8,
  };
  
  const prodcatID = prodcatIDs[productParam];
  
  // Nếu productParam là một product name
  if (prodcatID) {
      // Tìm sản phẩm theo prodcatID
      const query = `
          SELECT product.*, category.*
          FROM product
          JOIN category ON product.prodcatID = category.prodcatID
          WHERE product.prodcatID = ?`;

      db.query(query, [prodcatID], (error, results) => {
          if (error) throw error;

          if (results.length > 0) {
              res.json(results);
          } else {
              res.status(404).send('No products found for the given prodcatID');
          }
      });
  } else {
      // Nếu productParam là một prodType
      const query = `
          SELECT product.*, category.*
          FROM product
          JOIN category ON product.prodcatID = category.prodcatID
          WHERE product.prodType = ?`;

      db.query(query, [productParam], (error, results) => {
          if (error) throw error;

          if (results.length > 0) {
              res.json(results);
          } else {
              res.status(404).send('No products found for the given prodType');
          }
      });
  }
});

    


module.exports = router;