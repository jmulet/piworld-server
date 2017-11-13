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

import { pool } from './pool';
import * as winston from 'winston';
import * as async from 'async';
import { PoolConnection, QueryError } from 'mysql2';


export interface Query {
    results: any[] | any;
    error: boolean;
    fields: any[];
}

const emptyResults = function (sql: string) : any[] | any {
    const text = (sql ||  '').toLowerCase().trim();
    if (text.startsWith('select')) {
        return [];
    } else {
        return {};
    }
};

const ifEmptyFn = function (results: any[])  {
    return results.length === 0;
};

const ifNotEmptyFn = function (results: any[])  {
    return results.length > 0;
};

export const db = {
    QUERY_EMPTYSET: 'SELECT 1 FROM DUAL WHERE FALSE',

    pool: pool,

    getConnection: function(): Promise<PoolConnection> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err: any, con: PoolConnection) => {
                if (err) {
                    winston.log('error', err);
                    resolve(null);
                } else {
                    resolve(con);
                }
            });
        });
    },

    queryCon: function (sql: string, con: PoolConnection, objs?: any) : Promise<Query> {
        winston.log('debug', 'query=', sql, 'prepared=', objs);

        return new Promise((resolve, reject) => {
            con.execute(sql, objs, (err: QueryError, results: any, fields) => {
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
                } else {
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

    query: async function (sql: string, objs?: any): Promise<Query> {
         const con: PoolConnection = await db.getConnection();
         if (con) {
            const dataPromise = db.queryCon(sql, con, objs);
            dataPromise.then( (d) => con.release() ).catch( (d) => con.release() );
            return dataPromise;
         } else {
            return new Promise<Query>( (resolve, reject) => {
                winston.error('cannot get poolconnection');
                const query: Query = {
                    results: emptyResults(sql),
                    fields: [],
                    error: true
                };
                resolve(query);
            });

        }
    },

    queryIf: async function (testSql: string, sql: string, testFn: Function, objsTest?: any, objs?: any) {
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
                    });
                });
            }
        } catch (ex)  {
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


    queryIfEmpty: function (testSql: string, sql: string, objsTest?: any, objs?: any) {
        return db.queryIf(testSql, sql, ifEmptyFn, objsTest, objs);
    },

    queryIfNotEmpty: function (testSql: string, sql: string, objsTest?: any, objs?: any) {
        return db.queryIf(testSql, sql, ifNotEmptyFn, objsTest, objs);
    },

    querySeries: async function (sqls: any[], objs?: any[]) {
        objs = objs || [];
        let i = 0;
        const qs = [];
        for (const sql of sqls) {
                let sql2: string = sql;
                if (typeof(sql2) === 'function') {
                    sql2 = sql(qs);
                }
                const res = await db.query(sql2, objs[i]);
                qs.push(res);
                i += 1;
        }

        return Promise.all(qs);
    },

    queryParallel: function (sqls: any[], objs?: any[]) {
        objs = objs || [];
        return Promise.all( sqls.map((sql, i) => db.query(sql, objs[i]) ));
    }
};

