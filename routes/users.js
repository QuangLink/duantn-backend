const express = require("express");
const router = express.Router();
const db = require("./../models/database");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const { authenToken } = require("./middleware");
const bcrypt = require("bcrypt");

require("dotenv").config();

//get all users in users table
router.get("/", (req, res) => {
  const query = "SELECT * FROM users";
  db.query(query, (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

// Register
router.post("/register", async (req, res) => {
  const { username, password, mobile, email } = req.body;

  const queryCheckDup = "SELECT * FROM users WHERE username = ? OR email = ?";

  db.query(queryCheckDup, [username, email], async (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const duplicateFields = [];
    result.forEach((row) => {
      if (row.username === username) {
        duplicateFields.push("Username");
        console.log("dup : username");
      }
      if (row.email === email) {
        duplicateFields.push("Email");
        console.log("dup : email");
      }
    });

    if (duplicateFields.length > 0) {
      return res
        .status(400)
        .json({ error: "Duplicate entry for " + duplicateFields.join(", ") });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const insertQuery =
        "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
      db.query(
        insertQuery,
        [username, hashedPassword, email],
        (insertErr, insertResult) => {
          if (insertErr) {
            return res
              .status(500)
              .json({ error: "Internal Server Error" });
          }
          return res
            .status(201)
            .json({ message: "Record inserted successfully." });
        }
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

//login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const payload = {
        email: user.email,
        username: user.username,
        admin: user.admin,
        userID: user.userID,
      };
      console.log(payload.userID);
      console.log(payload.username);
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);

      res.json({ token, payload });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

//update dữ liệu vào bảng user, field firstname,lastname,state, flat, address,city where username, import authenToken
router.put("/address", (req, res) => {
  const { username, firstname, lastname, state, flat, street, city, mobile } =
    req.body;
  const query =
    "UPDATE users SET firstname = ?, lastname = ?, state = ?, flat = ?, street = ?, city = ?, mobile = ? WHERE username = ?";
  db.query(
    query,
    [firstname, lastname, state, flat, street, city, mobile, username],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
      return res.status(201).json({ message: "Record updated successfully." });
    }
  );
});

router.get("/address/:username", (req, res) => {
  const { username } = req.params;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(result[0]);
  });
});

router.delete("/address/:username", (req, res) => {
  const { username } = req.params;
  const query = `UPDATE users 
  SET firstname = "", lastname = "", state = "", flat = "", street = "", city = "" , mobile =""
  WHERE username = ?`;
  db.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    return res
      .status(200)
      .json({ message: "Address information deleted successfully." });
  });
});

module.exports = router;
