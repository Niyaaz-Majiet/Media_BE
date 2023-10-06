const authGateWay = require('../../dataAccessLayer/authDAL');

exports.generateToken = function (userObj, request, response) {
    const token = createToken(userObj, process.env.SECRET);
    authGateWay.upsertAuthToken(token, userObj.id).then(function () {
        response.set('x-access-token', token);
        response.set('Access-Control-Expose-Headers', 'x-access-token');
        delete userObj.password;
        response.status(200).send(userObj);
    }).catch(function (error) {
        console.error(error);
        response.status(500).send({message: error.message});
    });
};

exports.verifyAuthToken = function (request, response, next) {
    try {
        const token = request.headers['x-access-token'];

        if (token) {
            authGateWay.getUserByAuthToken(token).then(function (results) {
                if (results.recordset.length = 0) {
                    console.warn('No user for this token : ' + token);
                    response.status(401).send({message: 'An error occured please log out and then log back in again'});
                    return;
                }

                const currentUser = results.recordset[0];
                request.user = {
                    name: currentUser.name,
                    surname: currentUser.surname,
                    role: currentUser.role,
                    email: currentUser.email,
                };

                next();
            }).catch(function (error) {
                console.error(error.message);
                response.status(401).send({message: error.message})
            });
        } else {
            console.warn('Authentication Token Required');
            response.status(401).send({message: 'Authentication Token Required'});
        }
    } catch (e) {
        console.warn('Threw an exception : ' + e);
        response.status(500).send(e);
    }

};

const createToken = function (userObject, secret) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(userObject, secret, {
        expiresIn: '9999999m' // expires in 228 months
    });
};