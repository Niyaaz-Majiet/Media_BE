const profileDAL = require('../../dataAccessLayer/profileDAL');
const commonLogic = require('../commonLogic/commonLogic');

var q = require('q');

exports.register = function (app) {
    app.post('/api/createProfile', upserUser);
    app.post('/api/login', login);
    app.post('/api/resetPassword', resetPassword);
    app.post('/api/removeUser', removeUser);
}

function upserUser(request, response) {
    try {
        const {name, surname, password, email} = request.body;
        profileDAL.doesUserExist(email).then(function (results) {
            if (results.recordset[0]['doesExists'] !== 0) {
                response.status(409).send({message: 'Email already exists'});
            } else {
                const encriptionLib = require('bcrypt-nodejs');
                const encrptedPassword = encriptionLib.hashSync(password).toString();

                const user = {
                    name,
                    surname,
                    password: encrptedPassword,
                    email,
                }

                profileDAL.upsertUser(user).then(function () {
                    response.status(200).send({message: 'success'});
                });
            }
        }).catch(function (error) {
            console.error(error);
            response.status(500).send(error);
        })
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function login(request, response) {
    try {
        const {email, password} = request.body;

        profileDAL.getUserByEmail(email).then(function (results) {
            if (results.recordset.length === 0) {
                console.warn('User does not exist');
                response.status(401).json({message: 'Invalid username/password.'});
            } else {
                const userObj = results.recordset[0];
                const encriptionLib = require('bcrypt-nodejs');
                console.log(userObj)
                console.log(encriptionLib.hashSync(password))

                if (encriptionLib.compareSync(password, userObj.password)) {
                    commonLogic.generateToken(userObj, request, response);
                } else {
                    console.warn('Password is not valid')
                    response.status(401).json({message: 'Invalid username/password'});
                }
            }
        }).catch(function (error) {
            console.error(error);
            response.status(500).send(error);
        });
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function removeUser(request, response) {
    try {
        const {email, id} = request.body;
        profileDAL.getUserByEmail(email).then(function (results) {
            if (results.recordset.length === 0) {
                console.warn('User does not exist');
                response.status(401).json({message: 'Invalid username.'});
            } else {
                    profileDAL.deleteUser(id).then(function () {
                        response.status(200).send({message: 'success'});
                    });
            }
        });

        response.status(401).json({message: 'Remove User'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function resetPassword(request, response) {
    try {
        const {email, password} = request.body;
        profileDAL.getUserByEmail(email).then(function (results) {
            if (results.recordset.length === 0) {
                console.warn('User does not exist');
                response.status(401).json({message: 'Invalid username.'});
            } else {
                if(encriptionLib.compareSync(password, results.recordset[0].password)){
                    user.id = results.recordset[0].password;
                    profileDAL.upsertUser(user).then(function () {
                        response.status(200).send({message: 'success'});
                    });
                }else{
                    response.status(401).json({message: 'Invalid password.'}); 
                }    
            }
        });

        response.status(401).json({message: 'Remove User'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}