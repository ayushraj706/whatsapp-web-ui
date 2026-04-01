const admin = require('firebase-admin');
const config = require('../config');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(config.firebaseConfig),
        databaseURL: config.firebaseConfig.databaseURL
    });
}

const db = admin.database();
module.exports = db;
