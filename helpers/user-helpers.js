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
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION)
            .findOne({ user: objectId(userId)});

            if(userCart) {
                db.get().collection(collection.CART_COLLECTION).updateOne(
                    { user: objectId(userId) },
                    {
                        $push: {
                            items: objectId(productId)
                        }
                    }
                ).then(response => { resolve() });
            } else {
                let cartObj = {
                    user: objectId(userId),
                    items: [ objectId(productId) ]
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
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { cartList: '$items'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: [ '$_id', '$$cartList' ]
                                    }
                                }
                            }
                        ],
                        as: 'itemsInCart'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].itemsInCart)    
        })
    }

}