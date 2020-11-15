const { response } = require('express');
var express = require('express');
const { Db } = require('mongodb');
var router = express.Router();

var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

const verifyLogin = (req, res, next) => {
  if(req.session.userLoggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

/* GET home page. */
router.get('/', async (req, res, next) => {
  let user = req.session.user;
  
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
    req.session.user = response;
    req.session.userLoggedIn = true;
    res.redirect('/')
  })
});

router.get('/login', (req, res) => {
  if(req.session.user) {
    res.redirect('/')
  } else {
    let loginError = req.session.userLoginError;
    res.render('user/login', { loginError });
    req.session.userLoginError = false;
  }
});

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status) {
      req.session.user = response.user;
      req.session.userLoggedIn = true;
      res.redirect('/')
    } else {
      req.session.userLoginError = true;
      res.redirect('/login')
    }
  })
});

router.get('/logout', (req, res) => {
  // req.session.destroy();
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect('/')
});

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartItems = await userHelpers.getCartItems(req.session.user._id);
  let totalPrice = 0;
  if(cartItems.length > 0) {
    totalPrice = await userHelpers.getTotalPrice(req.session.user._id);
  }
  res.render('user/cart', { cartItems, totalPrice, user })
});

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log('added to cart')
  let productId = req.params.id;
  userHelpers.addToCart(req.session.user._id, productId).then(() => {
    res.json({ status: true })
  })
});

router.post('/change-product-quantity/:userId', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.totalPrice = await userHelpers.getTotalPrice(req.params.userId);
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

router.get('/place-order', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let totalPrice = await userHelpers.getTotalPrice(req.session.user._id);
  res.render('user/place-order', { hideSearch: true, totalPrice, user })
});

router.post('/place-order', async (req, res) => {
  let orderItems = await userHelpers.getOrderItemsList(req.body.userId);
  let totalPrice = await userHelpers.getTotalPrice(req.session.user._id);
  userHelpers.placeOrder(req.body, orderItems, totalPrice).then((orderId) => {
    if(req.body.paymentMethod === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        res.json(response)
      });
    }
  })
});

router.get('/order-successful', (req, res) => {
  let user = req.session.user;
  res.render('user/order-success', { user })
});

router.get('/orders', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.getOrders(user._id);
  res.render('user/orders', { orders, user })
});

router.get('/view-order-products/:orderId', verifyLogin, async (req, res) => {
  let orderId = req.params.orderId;
  let user = req.session.user;
  let orderProducts = await userHelpers.getOrderProducts(orderId);
  let orderDetails = await userHelpers.getOrderDetails(orderId);
  res.render('user/view-order-products', { user, orderId, orderProducts, orderDetails })
  console.log(orderDetails)
});

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=> {
      console.log('payment successful')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log('Payment failed');
    res.json({ status: false, errorMsg: 'ERROR' })
  })
});

router.get('/profile', (req, res) => {
  res.render('user/profile')
});

router.get('/add-to-favourites/:id', (req, res) => {
  let productId = req.params.id;
  userHelpers.addToFavourite(req.session.user._id, productId).then((response) => {
    res.json({ status: true })
  })
});

router.get('/favourites', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let favourites = await userHelpers.getFavouriteItems(req.session.user._id);
  res.render('user/favourites', { user, favourites })
});

router.get('/remove-from-favourites/:id', (req, res) => {
  let productId = req.params.id;
  userHelpers.removeFromFavourite(req.session.user._id, productId).then((response) => {
    res.json({ status: true })
  })
});

router.get('/product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  console.log(product);
  res.render('user/product-page', { product })
});


module.exports = router;
