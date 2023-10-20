const express = require('express');
const session = require('express-session');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const cors = require('cors');
const corsOptions = {
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  optionSuccessStatus: 200
}


// Importing routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const categoryRouter = require('./routes/category');
const cartRouter = require('./routes/cart');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productRouter);
app.use('/admin', adminRouter);
app.use('/category', categoryRouter);
app.use('/cart', cartRouter);
// 404 Not Found middleware
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
