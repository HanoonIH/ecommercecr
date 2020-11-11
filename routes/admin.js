const { response } = require('express');
var express = require('express');
var router = express.Router();

var productHelpers = require('../helpers/product-helpers');
var adminHelpers = require('../helpers/admin-helpers');

const verifyAdminLogin = (req, res, next) => {
  if(req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

/* GET users listing. */
router.get('/', verifyAdminLogin, function (req, res, next) {
  let admin = req.session.admin;
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin, products });
  })
});

router.get('/create/admin/create-admin', async (req, res) => {
  await adminHelpers.createAdmin().then(() => {
    res.send('Admin created')
  })
});

router.get('/login', (req, res) => {
  if(req.session.admin) {
    res.redirect('/admin')
  } else {
    let loginError = req.session.adminLoginError;
    res.render('admin/login', { loginError });
    req.session.adminLoginError = false;
  }
});

router.post('/login', (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if(response.status){
      req.session.admin = response.admin;
      req.session.adminLoggedIn = true;
      res.redirect('/admin')
    } else {
      req.session.adminLoginError = true;
      res.redirect('/admin/login');
    };
  })
});

router.get('/logout', (req, res) => {
  req.session.admin = null;
  req.session.adminLoggedIn = false;
  res.redirect('/');
});

router.get('/add-product', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin;
  res.render('admin/add-product', { admin })
});

router.post('/add-product', (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    image.mv('./public/images/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product')
      } else {
        console.log(err);
      }
    });
  })
});

router.get('/edit-product/:id', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin;
  let productId = req.params.id;
  productHelpers.getProductDetails(productId).then((data) => {
    let productDetails = data;
    res.render('admin/edit-product', { productDetails, admin })
  })
});

router.post('/edit-product/:id', (req, res) => {
  let productId = req.params.id;
  productHelpers.editProduct(productId, req.body).then(() => {
    res.redirect('/admin/');
    let image = req.files.image;
    if (req.files.image) {
      image.mv('./public/images/product-images/' + productId + '.jpg');
    }  
  })
});

router.get('/delete-product/:id', verifyAdminLogin, (req, res) => {
  let productId = req.params.id;
  productHelpers.deleteProduct(productId).then((response) => {
    res.redirect('/admin/')
  })
});

module.exports = router;
