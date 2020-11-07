var db = require('../config/connection');
var collection = require('../config/collections');

const bcrypt = require('bcrypt');
const { response } = require('express');
var objectId = require('mongodb').ObjectID;

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData)
            .then((data) => {
                resolve(data.ops[0])
            })
        })
    },

    doLogin: (loginData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db.get().collection(collection.USER_COLLECTION)
            .findOne({ email:loginData.email})

            if(user) {
                bcrypt.compare(loginData.password, user.password).then((status) => {
                    if(status) {
                        console.log('login success!');
                        response.user = user;
                        response.status = true;

                        resolve(response);
                    } else {
                        console.log('login failed :(');

                        resolve({ status: false });
                    }
                })
            } else {
                console.log('No user found!');

                resolve({ status: false });
            }
        })
    },

    addToCart: (userId, productId) => {

        let productObj = {
            item: objectId(productId),
            quantity: 1
        };

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION)
            .findOne({ user: objectId(userId)});

            if(userCart) {
                let isProductExist = userCart.items.findIndex( product => product.item == productId);
                
                if(isProductExist != -1) { 
                    db.get().collection(collection.CART_COLLECTION).updateOne(
                        { 'items.item': objectId(productId) },
                        {
                            $inc: { 'items.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne(
                        { user: objectId(userId) },
                        {
                            $push: {
                                items: productObj
                            }
                        }
                    ).then(response => {
                        resolve()
                    })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    items: [ productObj ]
                };      

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj)
                .then(reponse => {
                    resolve()
                });
            }
        })
    },

    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$items'
                },
                {
                    $project: {
                        item: '$items.item',
                        quantity: '$items.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'itemDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: [ '$itemDetails', 0 ]
                        }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)    
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = null;
            let userCart = await db.get().collection(collection.CART_COLLECTION)
            .findOne({ user: objectId(userId) });
            
            if(userCart) {
                cartCount = userCart.items.length;
            };
            resolve(cartCount);
        })
    },

    changeProductQuantity: (details) => {
        let count = parseInt(details.count);
        let quantity = parseInt(details.quantity);
        
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne(
                { _id: objectId(details.cart), 'items.item': objectId(details.product) },
                {
                    $inc: { 'items.$.quantity': count }
                }
            ).then((response) => {
                resolve(true)
            })

        })
    }

}