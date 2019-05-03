var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username:String,
    password:String,
    profileImage:String,
    backgroundImage:String,
    tweets:[{tweetMessage:String, tweetImage:String, tweetPublic:Boolean}]
});

module.exports = mongoose.model("User", UserSchema);
