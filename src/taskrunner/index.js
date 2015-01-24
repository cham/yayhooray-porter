'use strict';
var fs = require('fs');
var failCount = 0;
var delayMs = 10;
var startDelayMs = 2000;
var pageSize = 5000;

function writeToFile(type, err, msg){
    fs.appendFile('error.log', 'TYPE: ' + type + ', MSG: ' + msg + ', ERR: ' + err + '\n', function(err){
        if(err){
            console.log('COULD NOT WRITE ERROR TO FILE', err);
            console.log('TYPE: ' + type + ', MSG: ' + msg + ', ERR: ' + err);
        }
    });
}

function logError(err, msg){
    failCount++;
    if(err.err){
        if(err.err.indexOf('E11000') > -1){
            return writeToFile('duplicate', msg, err.err);
        }
    }
    return writeToFile('fail', msg, err);
}

function logBatchProgress(timeTaken, records, failures, currentPage, numPages){
    var eta = (numPages - currentPage - 1) * timeTaken;
    var logMsg = records + ' records, ' + (records-failures) + ' successful, ' + failures + ' logged errors, ' + timeTaken + 's, ETA ' + eta + 's / ' + (eta / 3600).toFixed(2) + 'h';
    console.log('Batch progress', logMsg);
}

function schedule(fn, iterator){
    setTimeout(fn, iterator * delayMs);
}

function startMessage(iterator){
    console.log('Starting - ETA ' + Math.ceil(iterator * delayMs / 1000) + 's');
}

function doneMessage(iterator){
    var numrecords = iterator + 1;
    schedule(function(){
        console.log('Done! ' + numrecords + ' records, ' + failCount + ' logged errors');
        process.exit();
    }, numrecords);
}

function runIterator(rows, fn){
    startMessage(rows.length);
    setTimeout(function(){
        rows.forEach(function(row, i){
            schedule(fn(row), i);
            if(i === rows.length - 1){
                doneMessage(i);
            }
        });
    }, startDelayMs);
}

function runSequential(rows, eachRowFn, doneFn){
    var i = 0;
    var updateEvery = Math.floor(rows.length / 20);
    
    function next(){
        if(i % updateEvery === 0){
            console.log('Sequence Progress ' + Math.floor((i / rows.length) * 100) + '%' );
        }
        eachRowFn(rows[i], function(){
            i++;
            if(rows[i]){
                next();
            }else{
                console.log('Sequence Complete! ' + i + ' records, ' + failCount + ' total logged errors so far');
                doneFn(i, failCount);
            }
        });
    }

    startMessage(rows.length);
    next();
}

function batchSequential(numRecordsFn, selectFn, insertFn, onSequence, onComplete){
    var currentPage = 0;
    var totalRecords = 0;

    numRecordsFn(function(numRows){
        var numPages = Math.ceil(numRows[0].numrecords / pageSize);

        function nextPage(){
            var pageTime = Date.now();

            console.log('nextPage', currentPage, 'of', numPages, (currentPage / numPages * 100).toFixed(2) + '%');

            selectFn(currentPage, function(rows){
                runSequential(rows, insertFn, function done(records, failures){
                    var timeTaken = Math.ceil((Date.now() - pageTime) / 1000);

                    currentPage++;
                    totalRecords += records;

                    if(currentPage < numPages){
                        logBatchProgress(timeTaken, totalRecords, failures, currentPage, numPages);
                        if(onSequence){ onSequence(); }
                        return nextPage();
                    }

                    console.log('Complete!');
                    logBatchProgress(timeTaken, totalRecords, failures, currentPage, numPages);
                    if(onComplete){ onComplete(); }
                });
            });
        }

        nextPage();
    });
}

module.exports.runIterator = runIterator;
module.exports.runSequential = runSequential;
module.exports.batchSequential = batchSequential;
module.exports.logError = logError;
module.exports.pageSize = pageSize;
