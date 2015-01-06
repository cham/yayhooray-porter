'use strict';
var mysql = require('./mysql');
var mongo = require('./mongo');
var taskRunner = require('./taskrunner');

function addThread(threadData, done){
    var thread = {
        created: new Date(Date.parse(threadData.created)),
        last_comment_by: threadData.lastpostby,
        last_comment_time: new Date(Date.parse(threadData.last_comment_created)),
        name: threadData.subject,
        nsfw: threadData.nsfw === 1,
        postedby: threadData.username,
        urlname: encodeURIComponent(threadData.subject.replace(/(\s-|[^A-Za-z0-9-])/g,'-')),
        numcomments: threadData.comments_count,
        categories: [threadData.category],
        originalid: threadData.thread_id
    };

    return new mongo.thread(thread).save(function(err){
        if(err){
            taskRunner.logError(err, threadData.thread_id);
        }
        done();
    });
}

function selectNumThreads(callback){
    var query = 'SELECT COUNT(thread_id) AS numrecords FROM threads';

    mysql
        .query(query)
        .then(callback)
        .catch(function(err){
            console.log('MySQL err', err);
        });
}

function selectThreads(page, cb){
    var query = 'SELECT thread_id, username, subject, c.name as category, t.created, ' +
                'nsfw, closed, t.last_comment_created, deleted, t.comments_count, ' +
                '  (SELECT u2.username FROM comments AS com LEFT JOIN users AS u2 ON com.user_id = u2.id ' +
                '   WHERE com.comment_id = ' +
                '     (SELECT MAX(comment_id) FROM comments AS comments2 WHERE comments2.thread_id = t.thread_id)' +
                '  ) AS lastpostby ' +
                'FROM threads AS t ' +
                'LEFT JOIN categories AS c ON t.category = c.category_id ' +
                'LEFT JOIN users AS u ON t.user_id = u.id ' +
                'ORDER BY t.comments_count DESC ' +
                'LIMIT ' + taskRunner.pageSize + ' OFFSET ' + (page * taskRunner.pageSize);

    console.log(query);
    
    mysql
        .query(query)
        .then(cb);
}

function correctThreadTotals(){
    mongo
        .thread
        .find({})
        .exec(function(err, threads){
            if(err){
                return taskRunner.logError(err);
            }
            threads.forEach(function(thread, i){
                mongo
                    .comment
                    .find({threadid: thread._id})
                    .sort('created')
                    .exec(function(err, comments){
                        if(err){
                            return taskRunner.logError(err);
                        }
                        var numComments = comments.length;
                        var lastComment = comments[numComments-1];

                        thread.last_comment_by = lastComment.postedby;
                        thread.last_comment_time = lastComment.created;
                        thread.numcomments = numComments;

                        thread.save(function(err){
                            if(err){
                                return taskRunner.logError(err);
                            }
                            console.log('done', i, thread._id);
                        });
                    });
            });
        });
}

function onProgress(){

}

function onComplete(){
    process.exit();
}

function portThreads(){
    taskRunner.batchSequential(selectNumThreads, selectThreads, addThread, onProgress, onComplete);
}

function deleteThreads(){
    console.log('deleting');
    mongo
        .thread
        .remove({}, function(err){
            if(err){
                return console.log(err);
            }
            console.log('collection removed');
            process.exit();
        });
}

function deleteRangeCache(){
    console.log('deleting');
    mongo
        .threadRange
        .remove({}, function(err){
            if(err){
                return console.log(err);
            }
            console.log('collection removed');
            process.exit();
        });
}

// mysql.connect();

module.exports.portThreads = portThreads;
module.exports.deleteThreads = deleteThreads;
module.exports.deleteRangeCache = deleteRangeCache;
module.exports.correctThreadTotals = correctThreadTotals;
