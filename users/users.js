const winston = require('winston'),
    fs = require('fs'),
    models = require('../mysql/pool.models'),
    utils = require('../mysql/utils'),
    db = utils.db,
    jwt = require('jwt-simple'),
    config = require('../server.config'),
    mdw_encrypted = require('../middlewares/mdw-encrypted');
    mdw_utils = require('../middlewares/mdw-utils'),
    promisify = require('util').promisify,
    readFile = promisify(fs.readFile),
    userCache = require('./auth-cache'),
    encrypt = require('../middlewares/security').encrypt,
    nodemailer = require('nodemailer'),
    authorizeBook = require('../books/authbooks').authorizeBook;

const clientFingerprint = function (req) {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    return new Buffer(ip).toString("base64").replace(/-/g, ".");
};

/**
 * This is the actual object send to client when doing a valid
 * login or auth 
 * @param {*} user 
 */
function genToken(user, ipAddr) {
    const expires = expiresIn(7); // 7 days
    const token = jwt.encode({
        exp: expires,
        key: user.id,
        idLogin: user.idLogin,
        idRole: user.idRole,
        ipAddr: ipAddr
    }, config.jwt_secret);

    user.token = token;
    user.expires = expires;

    return {
        token: token,
        expires: expires,
        user_info: encrypt(JSON.stringify(user))
    }
}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}






module.exports = function (app) {

    /**
     * Accessible: All
     * 
     * Body parameters: Encoding JSON
     *      access_token
     *      x_key = alias idUser
     * 
     * Returns: 
     *      A new getToken() object
     *      including token key, expire date, and user_info object
     * 
     * This method is used to restore session in client after page refresh
     */

    const auth = async function (req, res) {
        if (!mdw_utils.requireBodyParams(req, res, ['access_token'])) {
            return;
        }
        const p = req.body;

        try {
            const decode = jwt.decode(p.access_token, config.jwt_secret);

            if (!mdw_utils.validateToken(req, res, decode)) {
                return;
            }

            // Try to get user from cache
            const user_info = await userCache.getUser(decode.key, decode.idRole === app.config.USER_ROLES.parents, decode.idLogin);

            if (user_info) {
                // Generates a new token 
                const ipAddr = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
                const token = genToken(user_info, ipAddr);
                // Updates cache
                userCache.setCache(p.x_key, token.user_info);

                res.status(200).send({ ...token, status: 200, msg: 'valid session' });

            } else {
                res.status(400).send({ status: 400, msg: 'invalid session' });
            }

        } catch (Ex) {
            res.status(500).send({ status: 500, msg: 'Internal exception ' + Ex });
        }

    };



    /**
     * Accessible: All
     * 
     * Body parameters: Encoding text/plain;utf-8 encrypted
     *      username
     *      password
     *      parents = 0 / 1   if login is as parent
     *      bookId if exists it also validates the access to a given book
     * 
     * Returns: 
     *      A new getToken() object
     *      including token key, expire date, and user_info object
     * 
     * This method is start a new session
     */
    const login = async function (req, res) {

        try {
            const p = req.body;
            const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;

            // Check credentials against database users. 

            const whichPassword = p.parents ? "passwordParents" : "password";
            const whichValidation = p.parents ? "" : " AND (valid=1 OR idRole<" + app.config.USER_ROLES.student + ")";

            const testSql = "SELECT u.*, sc.schoolName, sc.professorName, sc.professorEmail, sc.language, sc.enrollPassword, sc.canEnroll, sc.canPublish FROM users as u " +
                " LEFT JOIN schools as sc on sc.id=u.schoolId WHERE BINARY " + whichPassword + "=? " +
                " AND " + whichPassword + "<>'' AND " + whichPassword + " IS NOT NULL " +
                " AND BINARY username=? " +
                whichValidation;

            const query0 = await db.query(testSql, [p.password, p.username]);
            if (query0.results.length === 0) {
                res.status(200).send({ status: 400, msg: 'Invalid user or password' });
                return;
            }
            const user_info = query0.results[0];
            user_info.password = null;
            user_info.passwordParents = null;

            const idUser = user_info.id;
            const creationDate = new Date();

            // Create a login entry
            const sql1 = "INSERT INTO logins (idUser, ip, parents, login) VALUES(?, ?, ?, ?)";
            const query1 = db.query(sql1, [idUser, ip, (p.parents ? "1" : "0"), creationDate]);

            // Get all groups associated with the user
            const sql2 = " SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, g.groupLevel, g.groupLetter, g.groupYear, " +
                " g.idUserCreator, u.fullname as creatorFullname, g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, g.thmcss, s.name  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup " +
                " INNER JOIN subjects as s ON s.id=g.idSubject LEFT JOIN users as u ON u.id=g.idUserCreator WHERE e.idUser=? ORDER BY g.groupYear DESC, g.groupName ASC";
            const query2 = db.query(sql2, [idUser]);

            // Read config file
            const query3 = readFile(__serverDir + '/config.json', 'utf8');

            const promises = [query1, query2, query3];

            //If book validation check if book is active for this user
            if (p.bookId) {
                const query4 = authorizeBook({ idUser: user_info.id, idRole: user_info.idRole, idLogin: user_info.idLogin, groups: user_info.groups.map((e) => e.idGroup).join(',') }, p.bookId);
                promises.push(query4);
            }

            // Parallel
            Promise.all(promises).then(([d1, d2, d3, d4]) => {
                user_info.idLogin = d1.results.insertId;
                try {
                    user_info.uopts = JSON.parse(user_info.uopts || '{}');
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
                // Set this user to userCache
                const token = genToken(user_info, ip);
                userCache.setCache(idUser, user_info);
                res.status(200).send({ ...token, status: 200, okbook: d4, msg: 'Valid user' });
            })
                .catch((d) => {
                    res.status(500).send({ status: 500, msg: d });
                });

        } catch (Ex) {
            res.status(500).send({ status: 500, msg: Ex });
        }

    };


    /**
    * Accessible: Validated only
    * 
    * Body parameters: Encoding text/plain;utf-8 encrypted
    *      idLogin
    * 
    * Returns: ok: true or false
    * 
    * This method is to end an existing session
    */
    const logout = async function (req, res) {
        const p = req.body;
        const login = await models.Logins.save({ id: p.idLogin, logout: new Date() });
        const dlogin = login.results;

        // Get rid of userCache entry holding session
        const key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
        userCache.setCache(key, null);
        res.status(200).send({ ok: !dlogin.error });
    };

    /**
    * Accessible: Validated only
    * 
    * Body parameters: Encoding text/plain;utf-8 encrypted
    *      username: if not set utilizes token idUser
    *      password
    *      parents 0 / 1 if exists
    * 
    * Returns: ok: true or false
    * 
    */
    const checkpwd = async function (req, res) {
        const p = req.body;

        // Check credentials against database users. 

        const whichPassword = p.parents ? "passwordParents" : "password";
        const objs = [p.password]
        let testSql;
        if (p.username) {
            testSql = "SELECT id FROM users WHERE BINARY " + whichPassword + "=? " +
                " AND BINARY username=? "
            objs.push(p.username);
        } else {
            testSql = "SELECT id FROM users WHERE BINARY " + whichPassword + "=? " +
                " AND id=? "
            objs.push(req.jwt.idUser);
        }

        const query0 = await db.query(testSql, objs);
        if (query0.results.length === 0) {
            res.status(200).send({ status: 400, msg: 'Invalid credentials' });
            return;
        }
        res.status(200).send({ status: 200, msg: 'Valid credentials' });
    };


    /**
    * Accessible: Validated only
    * 
    * Body parameters: Encoding text/plain;utf-8 encrypted
    *      username if not exists uses jwt idUser
    *      password
    *      parents 0 / 1 if exists
    * 
    * Returns: ok: true or false
    * 
    */
    const changepwd = async function (req, res) {
        const p = req.body;
        const whichPassword = p.parents ? "passwordParents" : "password";
        const objs = [p.password]

        let testSql;
        if (p.username) {
            testSql = "UPDATE users SET " + whichPassword + "=? WHERE username=?";
            objs.push(p.username);
        } else {
            testSql = "UPDATE users SET " + whichPassword + "=? WHERE id=?";
            objs.push(req.jwt.idUser);
        }

        const query0 = await db.query(testSql, objs);
        res.status(200).send({ ok: query0.results.affectedRows > 0 });
    };

    /**
    * Accessible: Validated only
    * 
    * Body parameters: Encoding json
    *      email
    * 
    * Returns: ok: true or false
    * 
    */
    const linkmail = async function (req, res) {

        if (!mdw_utils.requireBodyParams(req, res, ['email'])) {
            return;
        }

        const p = req.body;
        const idUser = p.idUser || req.jwt.idUser;
        const sql1 = "UPDATE users SET email=? WHERE id=?";
        const query1 = await db.query(sql1, [p.email || '', idUser || 0]);
        if (query1.results.affectedRows <= 0) {
            res.send({ ok: false, msg: 'Error updating database user' });
        };

        //Now send instructions email to this email
        var email = (p.email || "").replace("??", "");
        if (email) {
            var data = { idUser: idUser, email: p.email };
            var hash = new Buffer(JSON.stringify(data)).toString('base64');

            var acceptLink = 'https://' + app.config.hostname + "/rest/register?a=1&q=" + hash;
            var refuseLink = 'https://' + app.config.hostname + "/rest/register?a=0&q=" + hash;

            var text = "Necessitau verificar la vinculació de piWorld a aquest correu electrònic.\n" +
                p.fullname + " ha associat l'usuari " + p.username + " de piWorld amb aquest correu electrònic.\n" +
                "Si estau d'ACORD navegau l'enllaç " + acceptLink + "\n\n" +
                "Si no sou " + p.fullname + " rebutjeu navegant l'enllaç " + refuseLink;

            var html = "<h3>Necessitau verificar la vinculació de piWorld a aquest correu electrònic.</h3>" +
                "<p><em>" + p.fullname + "</em> ha associat l'usuari <em>" + p.username + "</em> de piWorld amb aquest correu electrònic.</p>" +
                "<p>Si estau d'ACORD cliqueu o navegau l'enllaç <a href='" + acceptLink + "'>" + acceptLink + "</a></p><br>" +
                "<p>Si no sou " + p.fullname + " rebutjeu clicant o navegau l'enllaç <a href='" + refuseLink + "'>" + refuseLink + "</a></p>";

            //Send an email
            var mailOptions = {
                from: 'piWorld Admin <' + app.config.adminEmail + '>', // sender address
                to: email,
                subject: 'Vinculació de piWorld a correu electrònic.',
                text: text,
                html: html
            };


            //create reusable transporter object using SMTP transport
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: app.config.adminEmail,
                    pass: app.config.adminEmailPass
                }
            });

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    winston.error(error);
                    res.send({ ok: false, msg: "Could not sent email." });
                } else {
                    winston.log('Message sent: ' + info.response);
                    res.send({ ok: true, msg: "Email modified and email sent." });
                }
            });
        } else {
            res.send({ ok: false, msg: "Could not sent email." });
        }


    };

    /**
     * Accessible: Validated only
     * 
     * Body parameters: Encoding json
     *      idUser or idGroup
     * 
     * Returns: ok: true or false
     * Forces a user (not parent) or group to change the password on next login
     */
    var forcePasswordChange = async function (req, res) {
        if (req.jwt.idRole >= app.config.USER_ROLES.student) {
            res.send({ ok: false, msg: "Students are not allowed to force password changes" });
            return;
        }

        const p = req.body;
        let sql;
        if (p.idGroup) {
            sql = "UPDATE users as u inner join enroll as e on e.`idUser`=u.id  SET u.`mustChgPwd`=1 WHERE e.idGroup=" +
                p.idGroup + " and e.idRole>=" + app.config.USER_ROLES.student;
        } else if (p.idUser) {
            sql = "UPDATE users SET mustChgPwd=1 WHERE id=" + p.idUser;
        } else  {
            res.send({ ok: false, msg: "Error: Either idUser or idGroup must be set!" });
            return;
        }

        const query = await db.query(sql);
        if (query.error || query.results.affectedRows <= 0) {
            res.send({ ok: false, msg: "No update has been made" });
        } else {
            res.send({ ok: true, msg: query.results.affectedRows + " students will be prompted with new password required on next login." });
        }
    };


    /**
    * Accessible: Validated only
    * 
    * Body parameters: Encoding json
    *      idUser
    * 
    * Returns a list of logins done by a given user
    */
    var loginList = async function (req, res) {
        if (req.jwt.idRole >= app.config.USER_ROLES.student && req.jwt.idUser !== idUser) {
            res.status(400).send({ msg: "Students are only allowed to list their own logins" });
            return;
        }
        const sql = "SELECT week(login,1) as week, login, if(logout is not null, time_to_sec(timediff(logout,login)), 0) as sec, ip FROM logins as l WHERE idUser=?";
        const d = await db.query(sql, [req.body.idUser ||  0]);
        const tt = 0;   // total login time in seconds
        const cc = {};  // login count per week
        d.results.forEach( (e) => {
            var p = cc[e.week];
            if (!p) {
                var p = { c: 0 };
                cc[e.week] = p;
            }
            p.c += 1;
            tt += e.sec;
        });
        const cc2 = { x: [], y: [] };
        Object.keys(cc).forEach( (ky) => {
            try {
                cc2.x.push(parseInt(ky));
                cc2.y.push(cc[ky].c);
            } catch (ex) {}
            
        }); 
        res.send({ totalTime: tt, counts: cc2, logins: d.result });
    };

    app.post('/api/auth', auth);
    app.post('/api/login', mdw_encrypted, login);

    app.post('/api/v1/logout', logout);
    app.post('/api/v1/checkpwd', mdw_encrypted, checkpwd);
    app.post('/api/v1/changepwd', mdw_encrypted, changepwd);
    app.post('/api/v1/linkmail', linkmail);
    app.post('/api/v1/forcepassword', forcePasswordChange);
    app.post('/api/v1/loginlist', loginList); 
};

 


