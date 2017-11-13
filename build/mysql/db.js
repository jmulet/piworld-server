"use strict";
/*
*   Wrapper around mysql2
*   Automatic handle/release of pooled connections
*   Unified query(sql, objects) syntax
*   returns a promise -> .results contains the array of rows
*   in a select query or and object in any other case.
*
*   Additions:
*    - queryIf, queryIfEmpty, queryIfNotEmpty
*
*    - querySeries([sql], [objects])  -> Returns a list of results.
*    - queryParallel([sql], [objects])  -> Returns a list of results.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = require("./pool");
const winston = require("winston");
const emptyResults = function (sql) {
    const text = (sql || '').toLowerCase().trim();
    if (text.startsWith('select')) {
        return [];
    }
    else {
        return {};
    }
};
const ifEmptyFn = function (results) {
    return results.length === 0;
};
const ifNotEmptyFn = function (results) {
    return results.length > 0;
};
exports.db = {
    QUERY_EMPTYSET: 'SELECT 1 FROM DUAL WHERE FALSE',
    pool: pool_1.pool,
    getConnection: function () {
        return new Promise((resolve, reject) => {
            pool_1.pool.getConnection((err, con) => {
                if (err) {
                    winston.log('error', err);
                    resolve(null);
                }
                else {
                    resolve(con);
                }
            });
        });
    },
    queryCon: function (sql, con, objs) {
        winston.log('debug', 'query=', sql, 'prepared=', objs);
        return new Promise((resolve, reject) => {
            con.execute(sql, objs, (err, results, fields) => {
                if (err) {
                    winston.error(err + '');
                    resolve({
                        results: emptyResults(sql),
                        fields: [],
                        error: true
                    });
                    return;
                }
                if (typeof (results.affectedRows) !== 'undefined') {
                    winston.log('debug', 'nup=' + results.affectedRows);
                }
                else {
                    winston.log('debug', 'rows.length=' + results.length);
                }
                resolve({
                    results: results,
                    fields: fields,
                    error: false
                });
            });
        });
    },
    query: function (sql, objs) {
        return __awaiter(this, void 0, void 0, function* () {
            const con = yield exports.db.getConnection();
            if (con) {
                const dataPromise = exports.db.queryCon(sql, con, objs);
                dataPromise.then((d) => con.release()).catch((d) => con.release());
                return dataPromise;
            }
            else {
                return new Promise((resolve, reject) => {
                    winston.error('cannot get poolconnection');
                    const query = {
                        results: emptyResults(sql),
                        fields: [],
                        error: true
                    };
                    resolve(query);
                });
            }
        });
    },
    queryIf: function (testSql, sql, testFn, objsTest, objs) {
        return __awaiter(this, void 0, void 0, function* () {
            let test;
            try {
                const con = yield exports.db.getConnection();
                if (!con) {
                    throw 'No connection';
                }
                test = yield exports.db.queryCon(testSql, con, objsTest);
                if (testFn(test.results) && !test.error) {
                    const dataPromise = exports.db.queryCon(sql, con, objs);
                    dataPromise.then((d) => con.release()).catch((d) => con.release());
                    return dataPromise;
                }
                else {
                    con.release();
                    return new Promise((resolve, reject) => {
                        resolve({
                            error: false,
                            results: emptyResults(sql),
                            fields: [],
                            conditionRejected: true
                        });
                    });
                }
            }
            catch (ex) {
                return new Promise((resolve, reject) => {
                    resolve({
                        error: true,
                        results: emptyResults(testSql),
                        fields: [],
                        conditionRejected: true
                    });
                });
            }
        });
    },
    queryIfEmpty: function (testSql, sql, objsTest, objs) {
        return exports.db.queryIf(testSql, sql, ifEmptyFn, objsTest, objs);
    },
    queryIfNotEmpty: function (testSql, sql, objsTest, objs) {
        return exports.db.queryIf(testSql, sql, ifNotEmptyFn, objsTest, objs);
    },
    querySeries: function (sqls, objs) {
        return __awaiter(this, void 0, void 0, function* () {
            objs = objs || [];
            let i = 0;
            const qs = [];
            for (const sql of sqls) {
                let sql2 = sql;
                if (typeof (sql2) === 'function') {
                    sql2 = sql(qs);
                }
                const res = yield exports.db.query(sql2, objs[i]);
                qs.push(res);
                i += 1;
            }
            return Promise.all(qs);
        });
    },
    queryParallel: function (sqls, objs) {
        objs = objs || [];
        return Promise.all(sqls.map((sql, i) => exports.db.query(sql, objs[i])));
    }
};
//# sourceMappingURL=db.js.map