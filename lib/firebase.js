const admin = require('firebase-admin');
const config = require('../config');

admin.initializeApp({
    credential: admin.credential.cert(config.firebase), 
    databaseURL: config.firebase.databaseURL
});

const db = admin.database();
module.exports = db;

