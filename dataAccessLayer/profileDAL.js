const sqlHelper = require('./DBHelper/dbHelper');

exports.upsertUser = function(user) {
  return sqlHelper.doMethod('UserUpsert',function (sql,request) {
      request
          .input('id',sql.Int,user?.id || null)
          .input('name',sql.NVarChar(25),user.name)
          .input('surname',sql.NVarChar(25),user.surname)
          .input('password',sql.NVarChar,user.password)
          .input('email',sql.NVarChar(25),user.email);
  });
};

exports.deleteUser = function (id) {
    return sqlHelper.doMethod('UserDelete',function (sql,request) {
             request
                 .input('id',sql.Int,id);
    });
};

exports.doesUserExist = function (email) {
  return sqlHelper.doMethod('CheckUserExistance',function (sql,request) {
       request
           .input('email',sql.NVarChar(50),email);
  });
};

exports.getUserByEmail = function (email) {
  return sqlHelper.doMethod('UserGetByEmail',function (sql,request) {
        request
            .input('email',sql.NVarChar(50),email);
  });
}