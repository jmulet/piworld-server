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
 
const pool = require('./pool'),
    winston = require('winston'),
    async = require('async');

const emptyResults = function (sql) {
    const text = (sql ||  '').toLowerCase().trim();
    if (text.startsWith('select')) {
        return [];
    } else {
        return {};
    }
};

const IfEmptyFn = function (results)  {
    return results.length === 0;
};

const IfNotEmptyFn = function (results)  {
    return results.length > 0;
};

const db = {
    QUERY_EMPTYSET: "SELECT 1 FROM DUAL WHERE FALSE",

    pool: pool,

    getConnection: function () {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, con) => {
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
        winston.log('debug', "query=", sql, "prepared=", objs);

        return new Promise((resolve, reject) => {
            con.execute(sql, objs, (err, results, fields) => {
                if (err) {
                    winston.error(err);
                    resolve({
                        results: emptyResults(sql),
                        fields: [],
                        error: true
                    });
                    return;
                }

                if (typeof (results.affectedRows) !== 'undefined') {
                    winston.log('debug', "nup=" + results.affectedRows);
                }
                else {
                    winston.log('debug', "rows.length=" + results.length);
                }

                resolve({
                    results: results,
                    fields: fields,
                    error: false
                });
            });
        });       
    },

    query: async function (sql, objs) {        
         var con = await db.getConnection();
         if (con) {
            const dataPromise = db.queryCon(sql, con, objs);
            dataPromise.then( (d) => con.release() ).catch( (d) => con.release() );
            return dataPromise;
         } else {
            return new Promise((resolve, reject) => {
                winston.error(err);
                resolve({
                    results: emptyResults(sql),
                    fields: [],
                    error: true
                });        
            });

        }     
    },

    queryIf: async function (testSql, sql, testFn, objsTest, objs) {
        let test;
        try {
            const con = await db.getConnection();
            if (!con) {
                throw 'No connection';
            }
            test = await db.queryCon(testSql, con, objsTest);
            if (testFn(test.results) && !test.error) {
                const dataPromise = db.queryCon(sql, con, objs);
                dataPromise.then( (d) => con.release() ).catch( (d) => con.release() );
                return dataPromise;
            } else {
                con.release();
                return new Promise((resolve, reject) => {
                    resolve({
                        error: false,
                        results: emptyResults(sql),
                        fields: [],
                        conditionRejected: true
                    })
                });
            }
        } catch (Ex)  {
            return new Promise((resolve, reject) => {
                resolve({
                    error: true,
                    results: emptyResults(testSql),
                    fields: [],
                    conditionRejected: true
                });
            });
        }
    },


    queryIfEmpty: function (testSql, sql, objsTest, objs) {
        return db.queryIf(testSql, sql, IfEmptyFn, objsTest, objs);
    },

    queryIfNotEmpty: function (testSql, sql, objsTest, objs) {
        return db.queryIf(testSql, sql, IfNotEmptyFn, objsTest, objs);
    },

    querySeries: async function (sqls, objs) {
        objs = objs || [];
        let i = 0;
        const qs = [];
        for (const sql of sqls) {
                let sql2 = sql;
                if (typeof(sql2) === "function"){
                    sql2 = sql(qs);
                }
                const res = await db.query(sql2, objs[i]);
                qs.push(res);
                i += 1;
        }         

        return Promise.all(qs);
    },

    queryParallel: function (sqls, objs) {
        objs = objs || [];
        return Promise.all( sqls.map((sql, i) => db.query(sql, objs[i]) ));
    }
};

module.exports = db;