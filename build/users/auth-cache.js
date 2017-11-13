"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../mysql/db");
const winston = require("winston");
const fs_1 = require("fs");
const util_1 = require("util");
const server_1 = require("../server");
const readFileAsync = util_1.promisify(fs_1.readFile);
class AuthCache {
    constructor() {
        this.userCache = {};
    }
    setCache(key, obj) {
        this.userCache[key + ''] = obj;
    }
    getCache(key) {
        return this.userCache[key + ''];
    }
    getUser(idUser, parents, ipAddr, idLogin) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const u = this.getCache(idUser + '');
            if (u) {
                resolve(u);
                return;
            }
            // If this user is not in cache, load it from database
            const sql0 = 'SELECT u.*, sc.schoolName, sc.professorName, sc.professorEmail, sc.language, sc.enrollPassword, ' +
                ' sc.canEnroll, sc.canPublish FROM users as u LEFT JOIN schools as sc on sc.id=u.schoolId WHERE u.id=?';
            const query0 = yield db_1.db.query(sql0, [idUser]);
            if (query0.results.length === 0) {
                resolve(null); // Not found
                return;
            }
            const userInfo = query0.results[0];
            userInfo.parents = parents;
            // Get all groups associated with the user
            const sql2 = ' SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, ' +
                ' g.groupLevel, g.groupLetter, g.groupYear, g.idUserCreator, u.fullname as creatorFullname, g.enrollPassword, ' +
                ' g.idSubject, g.currentUnit, g.gopts, g.thmcss, s.name  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup ' +
                ' INNER JOIN subjects as s ON s.id=g.idSubject LEFT JOIN users as u ON u.id=g.idUserCreator WHERE e.idUser=? ' +
                ' ORDER BY g.groupYear DESC, g.groupName ASC';
            const query2 = db_1.db.query(sql2, [idUser]);
            // Read config file
            const query3 = readFileAsync(server_1.global.__serverDir + '/config.json', 'utf8');
            const promises = [query2, query3];
            if (!idLogin) {
                const creationDate = new Date();
                const sql1 = 'INSERT INTO logins (idUser, ip, parents, login) VALUES(?, ?, ?, ?)';
                const query1 = db_1.db.query(sql1, [idUser, ipAddr, (parents ? '1' : '0'), creationDate]);
                promises.push(query1);
            }
            // Parallel
            Promise.all(promises).then(([d2, d3, d1]) => {
                if (d1) {
                    userInfo.idLogin = d1.results.insertId;
                }
                else {
                    userInfo.idLogin = idLogin;
                }
                try {
                    userInfo.uopts = JSON.parse(userInfo.uopts || '{}');
                }
                catch (ex) {
                    winston.error(ex);
                    userInfo.uopts = {};
                }
                userInfo.groups = d2.results || [];
                userInfo.groups.forEach((e) => {
                    try {
                        e.gopts = JSON.parse(e.gopts || '{}');
                    }
                    catch (ex) {
                        winston.error(ex);
                        e.gopts = { lang: 'es', showTools: true };
                    }
                });
                try {
                    userInfo.config = JSON.parse(d3);
                }
                catch (ex) {
                    console.log(ex);
                    userInfo.config = {};
                }
                resolve(userInfo);
            });
        }));
    }
}
exports.authCache = new AuthCache();
//# sourceMappingURL=auth-cache.js.map