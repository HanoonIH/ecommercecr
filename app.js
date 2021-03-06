var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var handlebars = require('handlebars')
var hbs = require('express-handlebars');
var fileUpload = require('express-fileupload');
var session = require('express-session');

var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var app = express();

var db = require('./config/connection');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs(
  {
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layout/',
    partialsDir: __dirname + '/views/partials'
  }
));

// handlebars custom helpers for conditional operators
handlebars.registerHelper('eq', function(a, b) {
  return (a === b);
});
handlebars.registerHelper('gt', function(a, b) {
  return (a > b);
});
handlebars.registerHelper('gte', function(a, b) {
  return (a >= b);
});
handlebars.registerHelper('lt', function(a, b) {
  return (a < b);
});
handlebars.registerHelper('lte', function(a, b) {
  return (a <= b);
});
handlebars.registerHelper('ne', function(a, b) {
  return (a !== b);
});

// handlebars math operators custom
handlebars.registerHelper('plus', function (a, b) {
  return parseInt(a) + parseInt(b);
});
handlebars.registerHelper('minus', function (a, b) {
  return parseInt(a) - parseInt(b);
});
handlebars.registerHelper('multiply', function (a, b) {
  return parseInt(a) * parseInt(b);
});
handlebars.registerHelper('divide', function (a, b) {
  return parseInt(a) / parseInt(b);
});
// handlebars custom helper end //

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(fileUpload());
app.use(session({
  secret: "secretkey",
  cookie: { maxAge: 60000 }
}));

db.connect((err) => {
  if(err) console.log("Connection Error")
  else console.log('database connected')
});

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
