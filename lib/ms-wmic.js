var csv = require('csv'),
    _ = require('lodash'),
    async = require('async'),
    spawn = require('child_process').spawn;

var buildWhereClause = function(opt, optional, cb) {
        var whereClause = ' ';

        if (_.isFunction(optional)) {
            cb = optional;
            optional = false;
        }
        if (!_.isFunction(cb)) {
            throw new TypeError('cb must be a function');
        }
        if (!_.isObject(opt)) {
            cb(optional ? null : new TypeError('opt must be an object'), whereClause);
            return;
        }

        if (_.isObject(opt.where)) {
            var keys = _.keys(opt.where);

            if (keys.length) {
                var buildComparison = function(prop, operator, value, i, done) {
                    if (!_.isString(operator)) {
                        done(TypeError('where object property "' + prop + '": operator is not a string'));
                    }
                    else if (!_.isString(value) && !_.isNumber(value)) {
                        done(TypeError('where object property "' + prop + '": value is not a string or number'));
                    }
                    else if (_.isEmpty(String(value))) {
                        done(TypeError('where object property "' + prop + '": value was an empty string'));
                    }
                    else if (prop === 'operator') {
                        done();
                    }
                    else {
                        whereClause += prop + " " + operator + " '" + value + "'";
                        whereClause += i < keys.length - 1 ? ' ' + opt.where.operator + ' ' : '" ';
                        done();
                    }
                };

                if (_.isString(opt.where.operator)) {
                    if (!_.contains(['AND', 'OR'], opt.where.operator.toUpperCase())) {
                        cb(new SyntaxError('opt.where.operator must be "AND" or "OR"'));
                        return;
                    }
                }
                else {
                    opt.where.operator = 'AND';
                }

                whereClause += 'where "';

                async.forEachOfSeries(keys, function(key, i, done) {
                    var prop = opt.where[key];

                    if (_.isPlainObject(prop)) {
                        buildComparison(key, prop.operator, prop.value, i, done);
                    }
                    else {
                        buildComparison(key, '=', prop, i, done);
                    }
                }, function(err) {
                    cb(err, whereClause);
                });
            }
            else {
                cb(optional ? null : new RangeError('where object was empty'), whereClause);
            }
        }
        else {
            cb(optional ? null : new TypeError('where property must be an object'), whereClause);
        }
    },
    buildGetClause = function(opt, cb) {
        if (!_.isFunction(cb)) {
            throw new TypeError('cb must be a function');
        }
        if (!_.isObject(opt)) {
            cb(new TypeError('opt must be an object'));
            return;
        }

        if (_.isArray(opt.get)) {
            if (opt.get.length) {
                var getClause = ' get ';

                _.each(opt.get, function(val, i) {
                    if (_.isString(val)) {
                        getClause += val;
                    }
                    else {
                        cb(RangeError('get array value at index ' + i + ' was not a string'));
                        return;
                    }

                    if (i < opt.get.length - 1) {
                        getClause += ',';
                    }
                    else {
                        getClause += ' ';
                        cb(null, getClause);
                    }
                });
            }
            else {
                cb(RangeError('get array was empty'));
            }
        }
        else {
            cb(TypeError('get property must be an array'));
        }
    },
    parseOuput = function(err, stdOut, cb) {
        if (err) {
            cb(err, [], stdOut);
            return;
        }

        csv.parse(stdOut.replace(/\r\r/g, '\n'), {columns: true, relax: true}, function(err, rows) {
            cb(err, rows, stdOut);
        });
    },
    wmic = module.exports = {
        execute: function(args, cb) {
            if (!_.isFunction(cb)) {
                cb = _.noop;
            }
            if (!_.isString(args)) {
                cb(new TypeError('args must be a string'));
                return wmic;
            }

            var stdOut = '',
                stdErr = '',
                proc = spawn('wmic', []);

            proc.stdout.on('data', function(data) {
                stdOut += data;
            });

            proc.stderr.on('data', function(data) {
                stdErr += data;
            });

            proc.on('close', function() {
                var lines = _.reduce(stdOut.split('\n'), function(result, line) {
                    return line.substr(0, 5).toUpperCase() === 'WMIC:' ? result : result + line;
                }, '');

                cb(stdErr ? new Error(stdErr.trim()) : null, lines.trim());
            });

            proc.stdin.end(args);

            return wmic;
        },
        process: {
            get: function(opt, cb) {
                if (!_.isFunction(cb)) {
                    throw new TypeError('cb must be a function');
                }

                async.waterfall([
                    async.apply(buildWhereClause, opt, true),
                    function(whereClause, done) {
                        buildGetClause(opt, function(err, getClause) {
                            done(err, [whereClause, getClause]);
                        });
                    }
                ], function(err, clauses) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    wmic.execute(
                        'process' + clauses[0] + clauses[1] + '/format:csv',
                        function(err, stdOut) {
                            parseOuput(err, stdOut, cb);
                        }
                    );
                });

                return wmic;
            },
            list: function(where, cb) {
                if (_.isFunction(where)) {
                    cb = where;
                }
                if (!_.isFunction(cb)) {
                    throw new TypeError('cb must be a function');
                }

                buildWhereClause({where: where}, true, function(err, whereClause) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    wmic.execute('process' + whereClause + 'list /format:csv', function(err, stdOut) {
                        parseOuput(err, stdOut, cb);
                    });
                });

                return wmic;
            },
            call: function(opt, cb) {
                if (!_.isFunction(cb)) {
                    cb = _.noop;
                }

                buildWhereClause(opt, function(err, whereClause) {
                    if (err) {
                        cb(err);
                    }
                    else if (!_.isString(opt.call)) {
                        cb(new TypeError('call property must be a string'));
                    }
                    else if (_.isEmpty(opt.call)) {
                        cb(new TypeError('call property was an empty string'));
                    }
                    else {
                        wmic.execute('process' + whereClause + 'call ' + opt.call, cb);
                    }
                });

                return wmic;
            },
            terminate: function(opt, cb) {
                if (!_.isFunction(cb)) {
                    cb = _.noop;
                }

                wmic.process.call(_.extend(opt, {call: 'terminate'}), function(err, stdOut) {
                    cb(err || (_.contains(stdOut, 'No Instance(s) Available') ? new Error(stdOut) : null), stdOut);
                });

                return wmic;
            }
        }
    };