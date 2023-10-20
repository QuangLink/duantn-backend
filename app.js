const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// Sử dụng cors middleware với các tùy chọn cần thiết
app.use(cors({
  origin: 'http://localhost:3000', // Thay đổi thành địa chỉ nguồn của bạn
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization, Origin, Accept',
}));

// Các cài đặt khác của ứng dụng Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes của bạn
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const categoryRouter = require('./routes/category');
const cartRouter = require('./routes/cart');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productRouter);
app.use('/admin', adminRouter);
app.use('/category', categoryRouter);
app.use('/cart', cartRouter);

// Middleware xử lý lỗi 404 Not Found
app.use(function(req, res, next) {
  next(createError(404));
});

// Middleware xử lý lỗi
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
