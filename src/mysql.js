'use strict';
var Q          = require('q');
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'yaylive'
});

function close(){
    connection.end();
}

function query(sql){
    var deferred = new Q.defer();

    connection.query(sql, function(err, rows){
        if(err){
            return deferred.reject(err);
        }

        deferred.resolve(rows);
    });

    return deferred.promise;
}

function connect(){
    connection.connect();
}

module.exports.connect = connect;
module.exports.query = query;
module.exports.close = close;
