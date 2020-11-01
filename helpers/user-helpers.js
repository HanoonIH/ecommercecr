var db = require('../config/connection');
var collection = require('../config/collections');

const bcrypt = require('bcrypt');

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
    }

}