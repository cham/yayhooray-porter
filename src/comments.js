'use strict';
var mysql = require('./mysql');
var mongo = require('./mongo');
var taskRunner = require('./taskrunner');

function getThreadId(query, cb){
    mongo
        .thread
        .findOne(query)
        .exec(function(err, thread){
            if(err){
                taskRunner.logError(err, query);
                return cb();
            }
            if(!thread){
                taskRunner.logError(new Error('Thread not found'), query);
                return cb();
            }
            cb(thread._id);
        });
}

function addComment(commentData, done){
    getThreadId({name: commentData.subject, originalid: commentData.thread_id}, function(threadid){
        var comment = {
            threadid: threadid,
            postedby: commentData.username,
            content: commentData.content,
            created: new Date(Date.parse(commentData.created)),
            edit_percent: 0,
            points: commentData.points
        };

        if(!threadid){
            return done();
        }

        return new mongo.comment(comment).save(function(err){
            if(err){
                taskRunner.logError(err, commentData);
            }

            done();
        });
    });
}

function selectComments(page, callback){
    var query = 'SELECT t.thread_id, u.username, t.subject, c.content, c.created, c.deleted, c.points ' +
                'FROM comments AS c ' +
                'LEFT JOIN users AS u ON u.id = c.user_id ' +
                'LEFT JOIN threads AS t ON t.thread_id = c.thread_id ' +
                'ORDER BY c.comment_id DESC ' +
                'LIMIT ' + taskRunner.pageSize + ' OFFSET ' + (page * taskRunner.pageSize);

    console.log(query);

    mysql
        .query(query)
        .then(callback)
        .catch(function(err){
            console.log('MySQL err', err);
        });
}

function selectNumComments(callback){
    var query = 'SELECT COUNT(comment_id) AS numrecords FROM comments';

    mysql
        .query(query)
        .then(callback)
        .catch(function(err){
            console.log('MySQL err', err);
        });
}

function onProgress(){

}

function onComplete(){
    process.exit();
}

function portComments(){
    taskRunner.batchSequential(selectNumComments, selectComments, addComment, onProgress, onComplete);
}

function deleteComments(){
    console.log('deleting');
    mongo
        .comment
        .remove({}, function(err){
            if(err){
                return console.log(err);
            }
            console.log('collection removed');
            process.exit();
        });
}

module.exports.portComments = portComments;
module.exports.deleteComments = deleteComments;

