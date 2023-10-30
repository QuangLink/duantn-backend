const express = require('express');
const router = express.Router();
const db = require('./../models/database');

router.get('/', (req, res) => {
  const query = `SELECT product.*, category.*
  FROM product
  LEFT JOIN category ON product.prodcatID = category.prodcatID;  
  `;
  db.query(query, (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

router.get('/search', (req, res) => {
  const prodName = req.query.prodName;

  // Nếu không có prodName được cung cấp, trả về tất cả các sản phẩm
  if (!prodName) {
    const query = 'SELECT * FROM product';
    db.query(query, (error, results) => {
      if (error) throw error;
      res.json(results);
    });
  } else {
    // Nếu prodName được cung cấp, tìm sản phẩm theo tên
    const query = 'SELECT * FROM product WHERE prodName LIKE ?';
    db.query(query, [`%${prodName}%`], (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        res.json(results);
      } else {
        res.status(404).send('No products found for the given prodName');
      }
    });
  }
});



// Get a specific product by ID
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  const query = `SELECT product.*, CEILING(AVG(feedback.prodRate) * 2) / 2 AS prodRateAvg
  FROM product
  LEFT JOIN feedback ON product.prodID = feedback.prodID
  WHERE product.prodID = ?`;
  db.query(query, [productId], (error, results) => {
    if (error) throw error;

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('Product not found');
    }
  });
});


// Add a new product
router.post('/', (req, res) => {
  const newProduct = req.body;
  const query = 'INSERT INTO product SET ?';
  db.query(query, newProduct, (error, results) => {
    if (error) throw error;
    res.status(201).send('Product added successfully');
  });
});

// Update an existing product by ID
router.put('/:id', (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  const query = 'UPDATE product SET ? WHERE prodID = ?';
  db.query(query, [updatedProduct, productId], (error, results) => {
    if (error) throw error;
    res.send('Product updated successfully');
  });
});

// Delete a product by ID
router.delete('/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM product WHERE prodID = ?';
  db.query(query, [productId], (error, results) => {
    if (error) throw error;
    res.send('Product deleted successfully');
  });
});

module.exports = router;
