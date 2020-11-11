var db = require('../config/connection');
var collection = require('../config/collections');
var adminInfo = require('../config/adminInfo');

const bcrypt = require('bcrypt');
const { response } = require('express');
var objectId = require('mongodb').ObjectID;


module.exports = {

    createAdmin: (admin = adminInfo) => {
        return new Promise(async (resolve, reject) => {
            admin.ADMIN_HASH_PASSWORD = await bcrypt.hash(admin.ADMIN_PASSWORD, 10);
            db.get().collection(collection.ADMIN_COLLECTION)
            .insertOne({
                email: admin.ADMIN_EMAIL,
                password: admin.ADMIN_HASH_PASSWORD,
            }).then(() => {
                resolve();
            });
        })
    },

    doAdminLogin: (loginDetails) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            let admin = await db.get().collection(collection.ADMIN_COLLECTION)
            .findOne({ email: loginDetails.email });

            if(admin) {
                bcrypt.compare(loginDetails.password, admin.password)
                .then((status) => {
                    if(status) {
                        console.log('ADMIN LOGGED IN SUCCESSFULLY!');
                        response.admin = admin;
                        response.status = true;
                        resolve(response)
                    } else {
                        console.log('INCORRECT ADMIN PASSWORD!');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("You're NOT AN ADMIN!");
                resolve({ status: false })
            }
        })
    },

}