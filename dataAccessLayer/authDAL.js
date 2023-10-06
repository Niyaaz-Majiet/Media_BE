const  sqlHelper = require('./DBHelper/dbHelper');

exports.upsertAuthToken = function (authToken,userId) {
   return sqlHelper.doMethod('AuthTokenUpsert',function (sql,request) {
    request
        .input('authToken',sql.NVarChar,authToken)
        .input('userId',sql.Int,userId);
   });
};

exports.getUserByAuthToken = function (token) {
    return sqlHelper.doMethod('UserGetByAuthToken',function (sql,request) {
             request
                 .input('authToken',sql.NVarChar,token);
    });
};