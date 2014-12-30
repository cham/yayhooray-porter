'use strict';
var mongoose = require('mongoose'),
    UserSchema = require('./schema/User'),
    CommentSchema = require('./schema/Comment'),
    ThreadSchema = require('./schema/Thread'),
    ThreadRangeSchema = require('./schema/ThreadRange'),
    MessageSchema = require('./schema/Message');

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost/tesladb', function(err){
    if(err){
        throw err;
    }
});

module.exports = {
    user: mongoose.model('User', UserSchema),
    comment: mongoose.model('Comment', CommentSchema),
    thread: mongoose.model('Thread', ThreadSchema),
    threadRange: mongoose.model('ThreadRange', ThreadRangeSchema),
    message: mongoose.model('Message', MessageSchema)
};
