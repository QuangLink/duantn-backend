const express = require("express");
const session = require("express-session");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "*",
    headers: ["Content-Type"],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
// Importing routes
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const productRouter = require("./routes/products");
const adminRouter = require("./routes/admin");
const categoryRouter = require("./routes/category");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const feedbackRouter = require("./routes/feedback");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// Routes

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/products", productRouter);
app.use("/admin", adminRouter);
app.use("/category", categoryRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/feedback", feedbackRouter);
// 404 Not Found middleware
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
