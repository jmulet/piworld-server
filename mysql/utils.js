const winston = require('winston');
const pool = require('./pool');
const db = require('./db');

class MappingModel {
    constructor(tableName, fields) {
        this.tableName = tableName;
        this.fields = fields;
        this.fieldKeys = Object.keys(this.fields);
        for (var fname in fields) {
            const f = fields[fname];
            if (f.primaryKey) {
                this.PK = fname;
            }
        }
        this.mappings = []; 
    }

    clone() {
        return new MappingModel(this.tableName, this.fields);
    }

    innerJoin(mapping, key) {
        this.mappings.push({mm: mapping, k: key, t: "INNER JOIN"});
        return this;
    }

    leftJoin(mapping, key) {
        this.mappings.push({mm: mapping, k: key, t: "LEFT JOIN"});
        return this;
    }

    createSelects(opts) {
        if (!opts ||  !opts.select) {
            return '*';
        }
      
        if (Array.isArray(opts.select)) {
            const list = opts.select.map((e)=> {
                if (Array.isArray(e) && e.length === 2 ) {
                    if (this.fieldKeys.indexOf(e[0]) >= 0) {
                        return "`" + e[0] + "` as `" + e[1] + "`";
                    } else {
                        return "";
                    }
                } else {
                    if (this.fieldKeys.indexOf(e) >= 0) {
                        return "`" + e + "`"
                    } else {
                        return "";
                    }
                }
            });
            return list.filter( e => e.length ).join(",");
        } else {
            return opts.select;
        }
    }

    createSearch(search) {
        let objs, searchStr = "";
        search = search || " 1=1 ";
        if ( typeof(search) === "object" ) {
            objs = [];
            let and = "";
            for (let key in search) {
                if (this.fieldKeys.indexOf(key) >=0 ) {
                    searchStr += and + " `" + key + "`=? ";
                    objs.push(search[key]);
                    and = "AND";
                }
            }
            searchStr = searchStr || "1=1";
        } else {
            searchStr = search;
        }
        return [searchStr, objs];
    }

    // Check types and perform type casting
    hasValidType(value, expected) {
        switch (expected) {
        case ("string"):
            return typeof(value) === "string";
        case ("integer"):
            return Number.isInteger(value);
        case ("float"):
            return typeof(value) === "number";
        case ("number"):
            return typeof(value) === "number";
        case ("date"):
            return value && value.getTime !== undefined;        
        case ("datetime"): {
            return value && value.getTime !== undefined;
        }
    }         
    }

    findById(id, opts) {
        const selects = this.createSelects(opts);
        return db.query("SELECT " + selects + " FROM `" + this.tableName + "` WHERE `" + this.PK + "`=?", [id]);
    }

    findOne(search, opts) {
        const selects = this.createSelects(opts);
        const [searchStr, objs] = this.createSearch(search);
        return db.query("SELECT " + selects + " FROM `" + this.tableName + "` WHERE " + searchStr + " LIMIT 1", objs);
    }

    all(opts) {
        const selects = this.createSelects(opts);
        let sql = "SELECT " + selects + " FROM `" + this.tableName+ "` ";
        this.mappings.forEach((x)=> {
            sql += x.type + " `"+ x.mm.tableName + "` ON ";
            if (x.key) {
                sql += "`" + this.tableName + "`.`" + key + "`=`"+ x.mm.tableName + "`.`" + x.mm.;
            }
        });
        return db.query(sql);
    }

    find(search, opts) {
        const selects = this.createSelects(opts);
        let [searchStr, objs] = this.createSearch(search);
        searchStr = searchStr || " 1=1 "
        let sql = "SELECT " + selects + " FROM `" + this.tableName + "` WHERE " + searchStr;
        if (opts.group) {
            sql += " GROUP BY " + opts.group;
        }
        if (opts.order) {
            sql += " ORDER BY " + opts.order;
        }
        if (opts.limit) {
            sql += " LIMIT ";
            if (opts.offset) {
                sql += opts.offset + ",";
            }
            sql += opts.limit;
        }

        return db.query(sql, objs);
    }

    save(model) {
        let sql;
        if (model[this.PK]) {
            sql = "UPDATE `" + this.tableName;
        } else {
            sql = "INSERT INTO `" + this.tableName;
        }

        const mfields= [], mvalues= [], prep = [];

        for (let prop in model) {
            const tableField = this.fields[prop];
            if (tableField) {
                const value = model[prop];
                // TODO: Must validate value against type
                if ( this.hasValidType(value,  tableField.type) ) {
                    mfields.push('`' + prop + '`');
                    prep.push('?');
                    mvalues.push(value);
                } else {
                    winston.log("ERR Model ", this.tableName, ": Field ", prop, " has wrong type.");
                }
            } else {
                winston.log("WARN Model ", this.tableName, ": Field ", prop, " neglected.");
            }
        }

        // Check for any missing required field and set it to default if present
        for (let prop in this.fields) {
            if (typeof (model[prop]) === 'undefined') {
                const f = this.fields;
                if (typeof (f.defaultValue) !== 'undefined') {
                    mfields.push('`' + prop + '`');
                    prep.push('?');
                    mvalues.push(f.defaultValue);
                }
            }
        }

        if (model[this.PK]) {
            sql += "` SET " + mfields.map((e) => e + '=?').join(",") + " WHERE " + this.PK + "='" + model[this.PK] + "'";
        } else {
            sql += "` (" + mfields.join(",") + ") VALUES(" + prep.join(",") + ")";
        }


        const dataPromise = db.query(sql, mvalues);
        dataPromise.then((d) => model[this.PK] = d.results.insertId);
        return dataPromise;
    }


    findOrCreate(model) {
        return new Promise( (resolve, reject) => {
            this.find(model).then( (d)=> {
                if (d.results.length === 0) {
                    this.save(model).then( (d2) => {
                        resolve(d2);
                    });
                } else {
                    resolve(d);
                }
            });
        });
    }

    createWhere(model) {
        let where = " 1=1 ";
        let objs = [];
        if (this.containsPK(model)) {
            where = " `" + this.PK + "`=? ";
            objs.push(model[this.PK]);
        } else {
            for (let prop in model) {
                where = " `" + prop + "`=? ";
                objs.push(model[this.PK]);
            }
        }
        return [where, objs];
    }

    containsPK(model) {
        return Object.keys(model).indexOf(this.PK) >= 0;
    }


}

const utils = {
    pool: pool,
    getConnection: async function () {
        return pool.getConnection();
    },
    db: db,
    define: function (tableName, fields) {
        return new MappingModel(tableName, fields);
    }
};

module.exports = utils;