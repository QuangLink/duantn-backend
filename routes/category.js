const express = require("express");
const router = express.Router();
const db = require("./../models/database");

// Get products where prodSale is not 0
router.get("/sale", (req, res) => {
  const query = "SELECT * FROM product WHERE prodSale <> 0"; // Thêm điều kiện WHERE
  db.query(query, (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

router.get('/:product/:prodType?', (req, res) => {
    const productParam = req.params.product;
    const prodTypeParam = req.params.prodType || null;
  
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
  
    if (!prodcatID) {
      res.status(404).send('Invalid product');
      return;
    }
  
    let query = `
      SELECT product.*, category.*
      FROM product
      JOIN category ON product.prodcatID = category.prodcatID
      WHERE product.prodcatID = ?`;
  
    // Nếu prodTypeParam đã được chỉ định, thêm điều kiện cho prodType
    if (prodTypeParam) {
      query += ' AND product.prodType = ?';
    }
  
    db.query(query, [prodcatID, prodTypeParam], (error, results) => {
      if (error) throw error;
  
      if (results.length > 0) {
        res.json(results);
      } else {
        res.status(404).send('No products found for the given prodcatID and prodType');
      }
    });
  });
  


module.exports = router;
