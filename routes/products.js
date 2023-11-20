const express = require("express");
const router = express.Router();
const db = require("./../models/database");

router.get("/", (req, res) => {
  const query = `
  SELECT 
    product.*, 
    category.*, 
    product_entry.*, 
    COALESCE(product_entry.prodPrice, product.prodPrice) AS prodPrice,
    COALESCE(product_entry.prodImg, product.prodImg) AS prodImg,
    COALESCE(product_entry.QTY, product.QTY) AS QTY,
    COALESCE(
        (COALESCE(product_entry.prodPrice, product.prodPrice) + 
         (COALESCE(product_entry.prodPrice, product.prodPrice) * product.prodSale / 100)),
        COALESCE(product_entry.prodPrice, product.prodPrice)
    ) AS prodPriceSale,
    COALESCE(product_entry.prodID, product.prodID) AS prodID,
    CEILING(AVG(feedback.prodRate) * 2) / 2 AS prodRateAvg
FROM 
    product
LEFT JOIN
    product_entry ON product.prodID = product_entry.prodID
LEFT JOIN
    category ON product.prodcatID = category.prodcatID
LEFT JOIN
    feedback ON product.prodID = feedback.prodID
WHERE product.QTY > 0 OR product_entry.QTY > 0
GROUP BY 
    product.prodID;
  
`;

  db.query(query, (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

router.get("/search", (req, res) => {
  const prodName = req.query.prodName;

  // Nếu không có prodName được cung cấp, trả về tất cả các sản phẩm
  if (!prodName) {
    const query = "SELECT * FROM product";
    db.query(query, (error, results) => {
      if (error) throw error;
      res.json(results);
    });
  } else {
    // Nếu prodName được cung cấp, tìm sản phẩm theo tên
    const query = "SELECT * FROM product WHERE prodName LIKE ? WHERE product.QTY > 0;";
    db.query(query, [`%${prodName}%`], (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        res.json(results);
      } else {
        res.status(404).send("No products found for the given prodName");
      }
    });
  }
});

//lấy sản phẩm có tất cả entry
//lấy sản phẩm dựa theo entry nhất định
//get all variant  product by id
// router.get('/:id', (req, res) => {
//   const productId = req.params.id;
//   const colorId = req.params.colorId || null;
//   const storageId = req.params.storageId || null;
//   const query = `SELECT
//   *,
//   COALESCE(product_entry.prodPrice, product.prodPrice) AS prodPrice,
//   product.prodSale,
//   COALESCE(
//       (COALESCE(product_entry.prodPrice, product.prodPrice) +
//        (COALESCE(product_entry.prodPrice, product.prodPrice) * product.prodSale / 100)),
//       COALESCE(product_entry.prodPrice, product.prodPrice)
//   ) AS prodPriceSale,
//   COALESCE(product_entry.prodID, product.prodID) AS prodID
//   -- Các trường khác mà bạn muốn lấy từ bảng product và product_entry
// FROM
//   product
// LEFT JOIN
//   product_entry ON product.prodID = product_entry.prodID
// LEFT JOIN
//   color ON product_entry.colorID = color.colorID
// LEFT JOIN
//   storage ON product_entry.storageID = storage.storageID
// WHERE
//    product.prodID = ?
//    `;
//   db.query(query, [productId, colorId, storageId], (error, results) => {
//     if (error) throw error;

//     if (results.length > 0) {
//       res.json(results[0]);
//     } else {
//       res.status(404).send('Product not found');
//     }
//   });
// });

router.get("/:id/:colorId?/:storageId?", (req, res) => {
  const productId = req.params.id;
  const colorId = req.params.colorId || null;
  const storageId = req.params.storageId || null;

  const query = `SELECT
  *,
  COALESCE(product_entry.prodPrice, product.prodPrice) AS prodPrice,
  COALESCE(product_entry.prodImg, product.prodImg) AS prodImg,
  product.prodSale,
  COALESCE(
      (COALESCE(product_entry.prodPrice, product.prodPrice) + 
       (COALESCE(product_entry.prodPrice, product.prodPrice) * product.prodSale / 100)),
      COALESCE(product_entry.prodPrice, product.prodPrice)
      
  ) AS prodPriceSale,
  COALESCE(product_entry.prodID, product.prodID) AS prodID
  -- Các trường khác mà bạn muốn lấy từ bảng product và product_entry
FROM
  product
LEFT JOIN
  product_entry ON product.prodID = product_entry.prodID
LEFT JOIN
  color ON product_entry.colorID = color.colorID
  
  LEFT JOIN
    category ON product.prodcatID = category.prodcatID
LEFT JOIN
  storage ON product_entry.storageID = storage.storageID
WHERE
  product.prodID = ?

  AND (? IS NULL OR product_entry.colorID = ?)
  AND (? IS NULL OR product_entry.storageID = ?)
  ;

`;

  db.query(
    query,
    [productId, colorId, colorId, storageId, storageId],
    (error, results) => {
      if (error) throw error;
      else if (results.length > 1) {
        res.json(results);
      } else if (results.length > 0) {
        res.json(results);
        console.log(results.length);
      } else {
        res.status(404).send("Product not found");
      }
    }
  );
});

// Add a new product
router.post("/", (req, res) => {
  const newProduct = req.body;
  const query = "INSERT INTO product SET ?";
  db.query(query, newProduct, (error, results) => {
    if (error) throw error;
    res.status(201).send("Product added successfully");
  });
});

// Update an existing product by ID
router.put("/:id", (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  const query = "UPDATE product SET ? WHERE prodID = ?";
  db.query(query, [updatedProduct, productId], (error, results) => {
    if (error) throw error;
    res.send("Product updated successfully");
  });
});

// Delete a product by ID
router.delete("/:id", (req, res) => {
  const productId = req.params.id;
  const query = "DELETE FROM product WHERE prodID = ?";
  db.query(query, [productId], (error, results) => {
    if (error) throw error;
    res.send("Product deleted successfully");
  });
});

module.exports = router;
