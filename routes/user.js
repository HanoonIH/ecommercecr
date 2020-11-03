const { response } = require('express');
var express = require('express');
var router = express.Router();

var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

const verifyLogin = (req, res, next) => {
  if(req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user;
  console.log(user);

  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user });
  })
});

router.get('/signup', (req, res) => {
  res.render('user/signup')
});

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then(response => {
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect('/')
  })
});

router.get('/login', (req, res) => {
  if(req.session.loggedIn) {
    res.redirect('/')
  } else {
    let loginError = req.session.loginError;
    res.render('user/login', { loginError });
    req.session.loginError = false;
  }
});

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/')
    } else {
      req.session.loginError = true;
      res.redirect('/login')
    }
  })
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
});

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartItems = await userHelpers.getCartItems(req.session.user._id);
  console.log(cartItems);
  res.render('user/cart', { cartItems, user })
});

router.get('/add-to-cart/:id',verifyLogin, (req, res) => {
  let productId = req.params.id;
  userHelpers.addToCart(req.session.user._id, productId).then(() => {
    res.redirect('/')
  })
});

module.exports = router;
