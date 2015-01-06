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
    var threadids = [
        132,
        134,
        171,
        193,
        194,
        198,
        206,
        279,
        330,
        337,
        372,
        400,
        434,
        456,
        490,
        504,
        541,
        579,
        615,
        629,
        650,
        689,
        696,
        711,
        760,
        788,
        793,
        901,
        978,
        982,
        1096,
        1104,
        1112,
        1159,
        1202,
        1375,
        1391,
        1438,
        1658,
        1715,
        1913,
        1943,
        1981,
        2589,
        2618,
        2698,
        2777,
        3778,
        3833,
        4071,
        4355,
        4471,
        5193,
        5563,
        6238,
        6681,
        6985,
        7323,
        7388,
        7474,
        7552,
        7845,
        8219,
        8615,
        8703,
        9088,
        10932,
        11004,
        11104,
        11231,
        11627,
        11668,
        11926,
        12063,
        12305,
        12644,
        13088,
        13591,
        13766,
        13797,
        14119,
        14736,
        14833,
        14906,
        14999,
        15219,
        15258,
        15442,
        16433,
        16688,
        16908,
        16931,
        17717,
        18169,
        18388,
        19125,
        19175,
        19953,
        20540,
        20662,
        20900,
        21581,
        23035,
        23470,
        24005,
        24798,
        25078,
        25832,
        26157,
        26248,
        26254,
        27066,
        27527,
        27621,
        27892,
        28051,
        28134,
        28484,
        28598,
        28792,
        28891,
        28908,
        28922,
        29354,
        29426,
        29568,
        29858,
        29929,
        30140,
        30276,
        30301,
        30315,
        30362,
        30373,
        30397,
        30515,
        30553,
        30690,
        30743,
        31119,
        31462,
        31657,
        31753,
        31797,
        31965,
        32050,
        32125,
        32143,
        32183,
        32188,
        32238,
        32301,
        32322,
        32323,
        32343,
        32409,
        32425,
        32429,
        32435,
        32466,
        32510,
        32515,
        32527,
        32535,
        32536,
        32539,
        32540,
        32542,
        32544,
        32549,
        32563,
        32565,
        32567,
        32570,
        32571,
        32572,
        32573,
        32574,
        32575,
        32576,
        32577,
        32578,
        32579,
        32580,
        32581,
        32582,
        32583,
        32584,
        32585,
        32586,
        32587,
        32588,
        32589,
        32590,
        32591,
        32592,
        32593,
        32594,
        32595,
        32596,
        32597,
        32598,
        32599,
        32600,
        32601,
        32602,
        32603,
        32604,
        32605,
        32606,
        32607,
        32608,
        32609,
        32610,
        32611,
        32612,
        32613,
        32614,
        32615,
        32616,
        32617
    ];

    function correctAndNext(threadid, done){
        mongo.thread.findOne({originalid: threadid}).exec(function(err, thread){
            if(err){
                taskRunner.logError(err);
                return done();
            }
            if(!thread || !thread._id){
                taskRunner.logError(new Error('no thread found'), threadid);
                return done();
            }
            var was = thread.numcomments;
            mongo.comment.find({threadid:thread._id}).count().exec(function(err, count){
                if(err){
                    taskRunner.logError(err);
                    return done();
                }
                mongo.thread.update({originalid: threadid},{$set:{numcomments: count}}).exec(function(err){
                    if(err){
                        taskRunner.logError(err);
                    }else{
                        console.log('done ' + threadid + ' was ' + was + ' now ' + count);
                    }
                    done();
                });
            });
        });
    }

    var cursor = 0;
    function next(){
        correctAndNext(threadids[cursor], function(){
            cursor++;
            if(threadids[cursor]){
                next();
            }else{
                console.log('done');
                process.exit();
            }
        });
    }
    next();
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
