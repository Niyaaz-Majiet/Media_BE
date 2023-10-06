var _pool = {connectionPool: null, requestsMade: 0, consecutiveErrors: 0, createdAt: 0};

const _retryAttempts = 1;
const _delayPerRetryAttemptSeconds = 5;
const _maxConsecutiveErrorCount = 100;

exports.startup = changeConnectionPool;

var _connecting = false;

function changeConnectionPool() {

    setImmediate(() => {
        console.warn('processId:' + process.pid + ' DB new connection pool requested...');
        if ((_pool.requestsMade === 0 && _pool.connectionPool) || Date.now() - _pool.createdAt < 60000 ) {
            console.warn('processId:' + process.pid + ' DB new connection pool request DENIED...');
            return;
        }
        if (_connecting === true) {
            console.warn('processId:' + process.pid + ' DB new connection pool request BUSY CONNECTING TO NEW POOL...');
            return;
        }
        _connecting = true;

        var sql = require('mssql');

        var lastPool = _pool;

        console.warn('processId:' + process.pid + ' DB CONNECTING: CREATING NEW CONNECTION POOL...');
        new sql.ConnectionPool(require('./../../config/database')).connect().then(function (pool) {
            console.warn('processId:' + process.pid + ' DB CONNECTED...');
            _pool = {
                requestsMade: 0,
                consecutiveErrors: 0,
                connectionPool: pool,
                createdAt: Date.now()
            };
            _pool.connectionPool.on('error', function (error) {
                console.error('DB error event thrown with: ' + error);
            });

            _connecting = false
        }).catch(function (error) {
            console.error('DB connection failed with error: ' + error.message);
            _connecting = false
        });

        if (lastPool.connectionPool)
            console.warn('processId:' + process.pid + ' DB Closing old pool SCHEDULED in 60 sec...');
        setTimeout(function () {
            if (lastPool.connectionPool) {
                console.warn('processId:' + process.pid + ' DB Closing old pool...');
                lastPool.connectionPool.close();
            }
        }, 60000);
    });
}

function getPool() {
    var q = require('q');
    var deferred = q.defer();

    function waitForConnection() {
        if (!_pool.connectionPool) {
            setTimeout(function () {
                if (_pool.requestsMade === 0 && !_pool.connectionPool)
                    changeConnectionPool();
                waitForConnection();
            }, 1000);
        } else if (_pool.consecutiveErrors > _maxConsecutiveErrorCount) {
            console.warn('DB connection has more than '+_maxConsecutiveErrorCount+' consecutive errors');
            changeConnectionPool();
            setTimeout(function () {
                waitForConnection();
            }, 1000);
        }
        else {
            deferred.resolve();
        }
    }

    waitForConnection();

    return deferred.promise;
}

var _limiter;
function SqlConcurrentLimiter() {
    var Bottleneck = require('bottleneck');
    if (!_limiter) {
        _limiter = new Bottleneck({
            maxConcurrent: 300,
            minTime: 1
        });
        _limiter.on("error", function (error) {
            console.error('Error on db limiter for SqlConcurrentLimiter: ' + error);
        });
    }
    return _limiter;
}

var _limiterDict = {};
function ConcurrentLimiter(methodName) {
    var Bottleneck = require('bottleneck');

    if (!_limiterDict[methodName]) {
        _limiterDict[methodName] = new Bottleneck({
            maxConcurrent: 5,
            minTime: 1
        });

        _limiterDict[methodName].on("error", function (error) {
            console.error('Error on db limiter for method ' + methodName + ': ' + error);
        });
    }
    return _limiterDict[methodName];
}

exports.doMethod = function (methodName, setupVarsCallback) {
    var q = require('q');

    var dbCall = {
        count: 1,
        methodName: methodName,
        callback: setupVarsCallback,
        deferred: q.defer(),
        createdAt: Date.now()
    };
    SqlConcurrentLimiter().schedule(() => executeSql(dbCall));
    return dbCall.deferred.promise;
};

function executeSql(dbCall) {

    if (!_pool.connectionPool) {
        if (!_connecting)
            getPool();
        SqlConcurrentLimiter().schedule(() => executeSql(dbCall));
    } else {

        function makeTheDbCall() {

            var dbCallTimeLeft = Date.now() - dbCall.createdAt;
            if (dbCallTimeLeft > 55000) {
                var error = new Error('DB Call has been queued for too long, forcing timeout after 55 seconds');
                dbCall.deferred.reject(error);
                // throw error;
                return;
            }

            if (dbCall.count > 1)
                console.warn('DB trying method ' + dbCall.methodName + ' for attempt ' + dbCall.count);
            var request = _pool.connectionPool.request();
            dbCall.callback(require('mssql'), request);
            _pool.requestsMade++;

            setTimeout(function () {
                request.cancel();
            }, 55000 - dbCallTimeLeft);

            return request.execute(dbCall.methodName);
        }

        ConcurrentLimiter(dbCall.methodName).schedule({expiration: 55000},makeTheDbCall).then(function (results) {
            _pool.consecutiveErrors = 0;
            dbCall.deferred.resolve(results);
        }).catch(function (error) {
            _pool.consecutiveErrors++;
            var errorMessage = '' + error;
            if (error.precedingErrors)
                for (var i = 0; i < error.precedingErrors.length; i++) {
                    errorMessage = errorMessage + '\n\n' + error.precedingErrors[i];
                }

            console.error('DB Error with method ' + dbCall.methodName + ' on attempt ' + dbCall.count + ' ERROR: ' + errorMessage);
            var isTimeoutError = errorMessage.indexOf('TimeoutError') !== -1; //TimeoutError: ResourceRequest timed out
            var isDeadlockError = errorMessage.indexOf('deadlocked') !== -1;
            var isConnectionError = errorMessage.indexOf('ConnectionError') !== -1;

            if ((!isTimeoutError && !isDeadlockError && !isConnectionError) || dbCall.count > _retryAttempts) {
                dbCall.deferred.reject(error);
            } else {
                if (!isDeadlockError)
                    changeConnectionPool();

                var timeout = Math.pow(_delayPerRetryAttemptSeconds, dbCall.count);
                timeout = Math.min(60, timeout);

                dbCall.count++;
                console.warn('DB trying method ' + dbCall.methodName + ' again, attempting number ' + dbCall.count + ' in minimum ' + timeout + ' seconds.');
                setTimeout(function () {
                    executeSql(dbCall);
                }, timeout * 1000);
            }
        });
    }
}