const  sqlHelper = require('./DBHelper/dbHelper');

exports.getAllMovies = function () {
    return sqlHelper.doMethod('MoviesGetAll',function (sql,request) {
             request;
    });
};

exports.GetAllMoviesByUserID = function (id) {
    return sqlHelper.doMethod('MoviesGetByUserID',function (sql,request) {
             request
                 .input('userId',sql.Int,id);
    });
};

exports.searchMoviesByPhrase = function (phrase) {
    return sqlHelper.doMethod('MoviesGetByPhrase',function (sql,request) {
             request
                 .input('phrase',sql.NVarChar,phrase);
    });
};

exports.getNextMediaByUserID = function (id) {
    return sqlHelper.doMethod('MoviesGetUserMovieHistory',function (sql,request) {
             request
                 .input('id',sql.NVarChar,id);
    });
};

exports.deleteMovieByUserId = function (id) {
    return sqlHelper.doMethod('MoviesDeleteByUserId',function (sql,request) {
             request
                 .input('id',sql.NVarChar,id);
    });
};

exports.deleteMovieById = function (id) {
    return sqlHelper.doMethod('MoviesDeleteByID',function (sql,request) {
             request
                 .input('id',sql.NVarChar,id);
    });
};