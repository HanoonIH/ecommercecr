const { response } = require('express');
var express = require('express');
var router = express.Router();

const Swal = require('sweetalert2');

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
router.get('/', async (req, res, next) => {
  let user = req.session.user;
  console.log(user);
  
  let cartCount = null;
  if(user) {
    cartCount = await userHelpers.getCartCount(user._id);
  }

  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount });
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
  res.render('user/cart', { cartItems, user })
});

router.get('/add-to-cart/:id', (req, res) => {
  console.log('added to cart')
  let productId = req.params.id;
  userHelpers.addToCart(req.session.user._id, productId).then(() => {
    // res.redirect('/')
    res.json({ status: true })
  })
});

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
});

router.get('/remove-from-cart/:cartId/:productId/:title', (req, res, next) => {
  userHelpers.removeFromCart(req.params.cartId, req.params.productId).then((response) => {
    // res.send({response})
    console.log(req.params.title + " removed from cart");
    res.redirect('/cart')
  })
});

router.get('/place-order',verifyLogin, async (req, res) => {
  let totalPrice = await userHelpers.getTotalPrice(req.session.user._id);
  res.render('user/place-order', { hideSearch: true })
})

module.exports = router;
