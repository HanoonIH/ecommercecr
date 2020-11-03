var db = require('../config/connection');
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectID;

module.exports = {

    addProduct: (product, callback) => {

        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            
            callback(data.ops[0]._id)
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
            resolve(products);
        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(productId) })
            .then((data) => {
                resolve(data);
            })
        })
    },

    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) })
            .then((data) => {
                resolve(data);
            })
        })
    },

    editProduct: (productId, editedDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne(
                { _id: objectId(productId) },
                {
                    $set: {
                        title: editedDetails.title,
                        category: editedDetails.category,
                        description: editedDetails.description,
                        price: editedDetails.price,
                    }
                }
            )
            .then((response) => {
                resolve()
            })
        })
    },

};