const { verifyAuthToken } = require('../commonLogic/commonLogic');
const { moviesDAL } = require('../../dataAccessLayer/moviesDAL');

var q = require('q');

exports.register = function (app) {
    app.get('/api/movies',verifyAuthToken, getAllMovies);
    app.get('/api/movies/:userId',verifyAuthToken, getAllMoviesByUserId);
    app.get('/api/movies/search/:phrase',verifyAuthToken, searchMoviesByPhrase);
    app.get('/api/movies/user/:userId',verifyAuthToken, getNextMediaByUserId);
    app.delete('/api/movies/:id',verifyAuthToken, removeMovie);
}

function getAllMovies(request, response) {
    try {
        moviesDAL.getAllMovies().then(results => {
            if (results.recordset.length === 0){
                response.status(200).send({data: results.recordset})
            }else{
                response.status(500).send({message: e})
            }
        });
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function getAllMoviesByUserId(request, response) {
    try {
        const { userId } = request.query;

        moviesDAL.getAllMoviesByUserId(userId).then((results)=> {
            if (results.recordset.length === 0){
                response.status(200).send({data: results.recordset})
            }else{
                response.status(500).send({message: e})
            }
        })

        response.status(401).json({message: 'Remove User'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function searchMoviesByPhrase(request, response) {
    try {
        const {phrase} = request.query;

        moviesDAL.searchMoviesByPhrase(phrase).then((results)=> {
            if (results.recordset.length === 0){
                response.status(200).send({data: results.recordset})
            }else{
                response.status(500).send({message: e})
            }
        })
        
        response.status(401).json({message: 'Reset Password'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function getNextMediaByUserId(request, response) {
    try {
        const {userId} = request.query;

        moviesDAL.getNextMediaByUserId(userId).then((results)=>{
            if (results.recordset.length === 0){
                response.status(200).send({data: results.recordset})
            }else{
                response.status(500).send({message: e})
            }
        })
        
        response.status(401).json({message: 'Reset Password'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function removeMovie(request, response) {
    try {
        const {movieId} = request.query;

        moviesDAL.deleteMovieById(movieId);
        
        response.status(401).json({message: 'Reset Password'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}

function removeMovieByUserId(request, response) {
    try {
        const {movieId} = request.query;

        moviesDAL.deleteMovieByUserId(movieId);
        
        response.status(401).json({message: 'Reset Password'});
    } catch (e) {
        console.error('threw an exception : ' + e);
        response.status(500).send({message: e})
    }
}