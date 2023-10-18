const express = require('express');
const router = express.Router();
const db = require('./../models/database');

router.get('/', (req, res) => {
  const query = 'SELECT * FROM product';
  db.query(query, (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});


// Get a specific product by ID
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM cart WHERE prodID = ?';
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
  const query = 'INSERT INTO cart SET ?';
  db.query(query, newProduct, (error, results) => {
    if (error) throw error;
    res.status(201).send('Product added successfully');
  });
});


// Delete a product by ID
router.delete('/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'DELETE FROM cart WHERE prodID = ?';
  db.query(query, [productId], (error, results) => {
    if (error) throw error;
    res.send('Product deleted successfully');
  });
});

module.exports = router;
