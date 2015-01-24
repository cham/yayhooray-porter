'use strict';
var users = require('./src/users');
var threads = require('./src/threads');
var comments = require('./src/comments');
var avatars = require('./src/avatars');
var mysql = require('./src/mysql');
var args = process.argv;

// mysql.connect();

if(args.indexOf('--port-users') > -1){
    users.portAccounts();
}
if(args.indexOf('--port-relationshops') > -1){
    users.portRelationships();
}
if(args.indexOf('--delete-relationships') > -1){
    users.deleteRelationships();
}
if(args.indexOf('--delete-users') > -1){
    users.deleteUsers();
}
if(args.indexOf('--drop-users-indexes') > -1){
    users.dropIndexes();
}
if(args.indexOf('--port-favorites') > -1){
    users.portFavorites();
}
if(args.indexOf('--delete-favorites') > -1){
    users.deleteFavorites();
}
if(args.indexOf('--port-hidden') > -1){
    users.portHidden();
}
if(args.indexOf('--delete-hidden') > -1){
    users.deleteHidden();
}
if(args.indexOf('--remove-ignored-buddies') > -1){
    users.removeIgnoredBuddies();
}

if(args.indexOf('--port-threads') > -1){
    threads.portThreads();
}
if(args.indexOf('--delete-threads') > -1){
    threads.deleteThreads();
}
if(args.indexOf('--delete-rangecache') > -1){
    threads.deleteRangeCache();
}
if(args.indexOf('--correct-thread-totals') > -1){
    threads.correctThreadTotals();
}

if(args.indexOf('--port-comments') > -1){
    comments.portComments();
}
if(args.indexOf('--delete-comments') > -1){
    comments.deleteComments();
}

if(args.indexOf('--port-avatars') > -1){
    avatars.portAvatars();
}
