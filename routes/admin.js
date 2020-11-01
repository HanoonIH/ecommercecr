var express = require('express');
var router = express.Router();

var productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin:true, products });
  })
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
});

router.post('/add-product', (req, res) => {
  
  productHelpers.addProduct(req.body, (id) => {

    let image = req.files.image;
    image.mv('./public/images/product-images/' +id+ '.jpg', (err, done) => {
      if(!err) {       
        res.render('admin/add-product')
      } else {
        console.log(err);
      }
    });
  })
})

module.exports = router;
