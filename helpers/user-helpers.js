var db = require('../config/connection');
var collection = require('../config/collections');
var adminInfo = require('../config/adminInfo');

const bcrypt = require('bcrypt');
const { response } = require('express');
var objectId = require('mongodb').ObjectID;

const Razorpay = require('razorpay');
const { resolve } = require('path');
// RazorPay instance
var instance = new Razorpay({
    key_id: 'rzp_test_RfIvkGgo123NXG',
    key_secret: 'CD9KtXAHsdacRQigcqw49xDE',
});

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
                .findOne({ email: loginData.email })

            if (user) {
                bcrypt.compare(loginData.password, user.password).then((status) => {
                    if (status) {
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
                .findOne({ user: objectId(userId) });

            if (userCart) {
                let isProductExist = userCart.items.findIndex(product => product.item == productId);

                if (isProductExist != -1) {
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
                    items: [productObj]
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
                                $arrayElemAt: ['$itemDetails', 0]
                            }
                        }
                    }
                ]).toArray();
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = null;
            let userCart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: objectId(userId) });

            if (userCart) {
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
                resolve({ status: true })
            })

        })
    },

    removeFromCart: (cartId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    { _id: objectId(cartId) },
                    {
                        $pull: {
                            items: { item: objectId(productId) }
                        }
                    }
                ).then(() => {
                    resolve({ removedFromCart: true })
                })
        })
    },

    getTotalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalCartPrice = await db.get().collection(collection.CART_COLLECTION)
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
                                $arrayElemAt: ['$itemDetails', 0]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] }
                            }
                        }
                    }
                ]).toArray();
            if (totalCartPrice) {
                resolve(totalCartPrice[0].total)
            }
        })
    },

    getOrderItemsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: objectId(userId) });

            resolve(cart.items);
        })
    },

    placeOrder: (orderDetails, orderItems, totalPrice) => {
        return new Promise((resolve, reject) => {
            let status = orderDetails.paymentMethod === 'COD' ? 'success' : 'pending';
            let orderObj = {
                DeliveryDetails: {
                    Phone: orderDetails.phoneNumber,
                    Address: orderDetails.deliveryAddress,
                    Pincode: orderDetails.pinCode
                },
                User: objectId(orderDetails.userId),
                PaymentMethod: orderDetails.paymentMethod,
                Products: orderItems,
                TotalAmount: totalPrice,
                Status: status,
                Time: new Date(),
            };

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
                .then((response) => {
                    //if(orderObj.Status == 'success'){
                    db.get().collection(collection.CART_COLLECTION)
                        .removeOne({ user: objectId(orderDetails.userId) });
                    //}
                    resolve(response.ops[0]._id)
                });
        })
    },

    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ User: objectId(userId) })
                .toArray();
            resolve(orders);
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(orderId) }
                    },
                    {
                        $unwind: '$Products'
                    },
                    {
                        $project: {
                            item: '$Products.item',
                            quantity: '$Products.quantity'
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
                                $arrayElemAt: ['$itemDetails', 0]
                            }
                        }
                    }
                ]).toArray();
            resolve(orderItems);
        })
    },

    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION)
                .findOne({ _id: objectId(orderId) });
            resolve(orderDetails);
        })
    },

    generateRazorPay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalPrice * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: `${orderId}`
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log('ERROR Is:', err)
                } else {
                    console.log('order placed: ', order);
                    resolve(order)
                }
            });
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'CD9KtXAHsdacRQigcqw49xDE');

            hmac.update(details['payment[razorpay_order_id]'] +'|'+ details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if(hmac == details['payment[razorpay_signature]']) {
                resolve();
            } else {
                reject();
            }
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne(
                { _id: objectId(orderId) },
                {
                    $set: {
                        Status: 'success'
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },

    addToFavourite: (userId, productId) => {
        let favItem = objectId(productId);
        return new Promise(async (resolve, reject) => {
            let userFavourites = await db.get().collection(collection.FAVOURITE_COLLECTION)
            .findOne({ user: objectId(userId) });

            if(userFavourites) {
                let isItemExistInFav = userFavourites.items.findIndex(item => item == productId); 

                if(isItemExistInFav != -1) {
                    resolve('already item faved')
                } else {
                    db.get().collection(collection.FAVOURITE_COLLECTION)
                    .updateOne(
                        { user: objectId(userId) },
                        {
                            $push: {
                                items: favItem
                            }
                        }
                    ).then((response) => {
                        resolve('new fav updated')
                    })
                }

            } else {
                let favouriteObj = {
                    user: objectId(userId),
                    items: [ objectId(productId) ]
                }

                db.get().collection(collection.FAVOURITE_COLLECTION)
                .insertOne(favouriteObj).then((response) => {
                    resolve('fav new user created')
                })
            }
        })
    },

    removeFromFavourite: (userId, productId) => {
        return new Promise((resolve, reject) => {  
            db.get().collection(collection.FAVOURITE_COLLECTION)
            .updateOne(
                { user: objectId(userId) },
                {
                    $pull: {
                        items: objectId(productId)
                    }
                }
            ).then((response) => {
                resolve();
            })
        })
    },

    getFavouriteItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let favItems = await db.get().collection(collection.FAVOURITE_COLLECTION)
            .aggregate([
                {
                    $match: { user: objectId(userId) }
                }, 
                {
                    $unwind: '$items'
                },
                {
                    $project: {
                        item: '$items'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1,
                        product: {
                            $arrayElemAt: ['$productDetails', 0]
                        }
                    }
                }
            ]).toArray()
            resolve(favItems)
        });
    },

}