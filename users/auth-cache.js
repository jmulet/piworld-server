const db = require('../mysql/db');
const winston = require('winston');
const userCache = {};

const auth = {

    setCache: function(key, obj) {
        userCache[key+''] = obj;
    },

    getCache: function(key) {
        return userCache[key+''];
    },

    getUser: function (idUser, parents, idLogin) {

        return new Promise(async (resolve) => {
            const u = auth.getCache(idUser);
            if (u) {
                resolve(u);
                return;
            }

            // If this user is not in cache, load it from database

            const sql0 = "SELECT u.*, sc.schoolName, sc.professorName, sc.professorEmail, sc.language, sc.enrollPassword, sc.canEnroll, sc.canPublish FROM users as u " +
                " LEFT JOIN schools as sc on sc.id=u.schoolId WHERE u.id=?";

            const query0 = await db.query(sql0, [idUser]);
            if (query0.results.length === 0) {
                resolve(null);  // Not found
                return;
            }
            const user_info = query0.results[0];
            user_info.parents = parents;

            // Get all groups associated with the user
            const sql2 = " SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, g.groupLevel, g.groupLetter, g.groupYear, " +
                " g.idUserCreator, u.fullname as creatorFullname, g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, g.thmcss, s.name  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup " +
                " INNER JOIN subjects as s ON s.id=g.idSubject LEFT JOIN users as u ON u.id=g.idUserCreator WHERE e.idUser=? ORDER BY g.groupYear DESC, g.groupName ASC";
            const query2 = db.query(sql2, [idUser]);

            // Read config file
            const query3 = readFile(__serverDir + '/config.json', 'utf8');

            const promises = [query2, query3];

            if (!idLogin) {
                const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
                const creationDate = new Date();
                const sql1 = "INSERT INTO logins (idUser, ip, parents, login) VALUES(?, ?, ?, ?)";
                const query1 = db.query(sql1, [idUser, ip, (parents ? "1" : "0"), creationDate]);
                promises.push(query1);
            }

            // Parallel
            Promise.all(promises).then(([d2, d3, d1]) => {
                if (d1) {
                    user_info.idLogin = d1.results.insertId;
                } else {
                    user_info.idLogin = idLogin;
                }

                try {
                    user_info.uopts = JSON.parse(pd.user_info.uopts || '{}');
                }
                catch (ex) {
                    winston.error(ex);
                    user_info.uopts = {};
                }
                user_info.groups = d2.results || [];
                user_info.groups.forEach((e) => {
                    try {
                        e.gopts = JSON.parse(e.gopts || '{}');
                    }
                    catch (ex) {
                        winston.error(ex);
                        e.gopts = { lang: 'es', showTools: true };
                    }
                });

                try {
                    user_info.config = JSON.parse(d3);
                } catch (ex) {
                    console.log(ex);
                    user_info.config = {};
                };
                resolve(user_info);
            });

        });

    }
};

module.exports = auth;

