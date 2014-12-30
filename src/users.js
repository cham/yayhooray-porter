'use strict';
var mysql = require('./mysql');
var mongo = require('./mongo');
var taskRunner = require('./taskrunner');
var winston = require('winston');

function deleteUser(userData){
    mongo
        .user
        .findOne({username: userData.username})
        .remove(function(err){
            if(err){
                return taskRunner.logError(err);
            }
        });
}

function buildWebsites(userData){
    return [
        {name: 'website_1', url: userData.website_1},
        {name: 'website_2', url: userData.website_2},
        {name: 'website_3', url: userData.website_3},
        {name: 'flickr_username', url: userData.flickr_username},
        {name: 'facebook', url: userData.facebook},
        {name: 'aim', url: userData.aim},
        {name: 'gchat', url: userData.gchat},
        {name: 'lastfm', url: userData.lastfm},
        {name: 'msn', url: userData.msn},
        {name: 'twitter', url: userData.twitter}
    ];
}

function addUser(userData){
    return new mongo.user({
        username: userData.username,
        urlname: encodeURIComponent(userData.username.toLowerCase()),
        password: userData.password,
        email: userData.email,
        last_ip: userData.last_ip,
        last_login: new Date(Date.parse(userData.last_login || userData.created)),
        created: new Date(Date.parse(userData.created)),
        modified: new Date(Date.parse(userData.modified || userData.created)),
        participated: [],
        favourites: [],
        hidden: [],
        buddies: [],
        ignores: [],
        websites: buildWebsites(userData),
        known_ips: [userData.last_ip],
        comments_count: userData.comments_count,
        threads_count: userData.threads_count,
        random_titles: userData.random_titles === 1,
        view_html: userData.view_html === 1,
        about: userData.about_blurb || '',
        custom_css: userData.custom_css || '',
        custom_js: userData.custom_js || '',
        fixed_chat_size: userData.chat_fixed_size,
        hide_enemy_posts: userData.hide_enemy_posts,
        lastpointusage: new Date(Date.parse(userData.lastpointusage || userData.last_login || userData.created)),
        location: userData.location || '',
        realname: userData.name || '',
        timezone: userData.timezone || 0,
        comment_size: userData.comments_shown,
        thread_size: userData.threads_shown,
        points: userData.points > 0 ? userData.points : 0,
        activated: userData.activated === 1,
        banned: userData.banned === 1,
        membernumber: userData.user_id
    }).save(function(err){
        if(err){
            return taskRunner.logError(err, userData.username);
        }
    });
}

function deleteBuddies(userData){
    mongo
        .user
        .findOne({username: userData.username})
        .exec(function(err, user){
            if(err){
                return taskRunner.logError(err, userData.username);
            }
            if(!user){
                return taskRunner.logError(new Error('User not found'), userData.username);
            }

            user.ignores = [];
            user.buddies = [];

            user.save(function(err){
                if(err){
                    return taskRunner.logError(err, userData.username);
                }
            });
        });
}

function addRelationships(relationship){
    var from = relationship.from;
    var buddies = relationship.buddies;
    var ignores = relationship.ignores;

    mongo
        .user
        .findOne({username: from})
        .exec(function(err, user){
            if(err){
                return taskRunner.logError(err, from);
            }
            if(!user){
                return taskRunner.logError(new Error('User not found'), from);
            }

            user.buddies = buddies;
            user.ignores = ignores;

            user.save(function(err){
                if(err){
                    return taskRunner.logError(err, from);
                }
            });
        });
}

function translateRelationships(relationships){
    var lastFrom = relationships[0].user1;
    var buddies = [];
    var ignores = [];
    var translated;
    
    translated = relationships.reduce(function(memo, relationship){
        var from = relationship.user1;
        var to = relationship.user2;
        var isBuddy = relationship.buddy;

        if(from !== lastFrom){
            memo.push({from: lastFrom, buddies: buddies, ignores: ignores});
            lastFrom = from;
            buddies = [];
            ignores = [];
        }
        if(isBuddy){
            buddies.push(to);
        }else{
            ignores.push(to);
        }

        return memo;
    }, []);

    return translated;
}

function selectUsers(cb){
    mysql.connect();

    mysql
        .query('SELECT * FROM users AS u ' +
               'LEFT JOIN user_profiles AS p ON u.id = p.user_id')
        .then(cb);

    mysql.close();
}

function selectBuddies(cb){
    mysql.connect();

    mysql
        .query('SELECT u.username AS user1, us.username AS user2, a.type = 1 AS buddy ' +
               'FROM acquaintances AS a ' +
               'LEFT JOIN users AS u ON u.id = a.user_id ' +
               'LEFT JOIN users AS us ON us.id = a.acq_user_id ' +
               'ORDER BY u.username')
        .then(cb);

    mysql.close();
}

function portAccounts(){
    selectUsers(function(rows){
        taskRunner.runIterator(rows, addUser);
    });
}

function portRelationships(){
    selectBuddies(function(rows){
        var translatedData = translateRelationships(rows);
        taskRunner.runIterator(translatedData, addRelationships);
    });
}

function deleteRelationships(){
    selectUsers(function(rows){
        taskRunner.runIterator(rows, deleteBuddies);
    });
}

function deleteUsers(){
    selectUsers(function(rows){
        taskRunner.runIterator(rows, function(userData){
            if(userData.username === 'cham'){
                return winston.info('Not deleting ' + userData.username);
            }
            deleteUser(userData);
        });
    });
}

function dropIndexes(){
    mongo.user.collection.dropAllIndexes(function(err, results){
        if(err){
            return taskRunner.logError(err);
        }
        winston.info(results);
        process.exit();
    });
}

module.exports.portAccounts = portAccounts;
module.exports.portRelationships = portRelationships;
module.exports.deleteRelationships = deleteRelationships;
module.exports.deleteUsers = deleteUsers;
module.exports.dropIndexes = dropIndexes;
