const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

//Basic user, no checking at all whoops
const User = new Schema({
    username: String,
    password: String
});

//Add the plugin
User.plugin(passportLocalMongoose);

//Export the model based on the Schema
module.exports = mongoose.model('User', User);