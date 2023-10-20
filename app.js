const express = require('express');
const session = require('express-session');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
// Importing routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const categoryRouter = require('./routes/category');
const cartRouter = require('./routes/cart');


// Session configuration
const options = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'duantn'
};


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
