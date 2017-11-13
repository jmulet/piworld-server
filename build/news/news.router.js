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
const async = require("async");
const db_1 = require("../mysql/db");
const express_1 = require("express");
const dateformat = require("dateformat");
const newsList = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = req.body;
        let sql1 = 'SELECT * FROM news';
        if (p.filter) {
            sql1 += ' WHERE expires IS NULL OR expires>=NOW()';
        }
        sql1 += ' ORDER BY `order` ASC, id DESC';
        const promises = [db_1.db.query(sql1)];
        // If badges key present show a news with last granted badges
        if (p.badges) {
            const sql2 = 'SELECT b.*, u.fullname, s.schoolName FROM badges as b INNER JOIN users as u ' +
                'on u.id=b.idUser INNER JOIN schools as s on s.id=u.schoolId WHERE b.day >= (NOW() - INTERVAL 10 DAY) ' +
                'AND b.type < 200 ORDER BY `day` DESC, b.type ASC, u.fullname ASC LIMIT 4 ';
            promises.push(db_1.db.query(sql2));
        }
        Promise.all(promises).then((d) => {
            if (d[1] && d[1].results.length) {
                let html = '<p>Darreres <b>Insígnies</b> aconseguides:</p><table class="table">';
                d[1].results.forEach((e) => {
                    html += '<tr>';
                    html += '<th style="width:100px;text-align: right;vertical-align: middle;"><img src="assets/img/badge-' +
                        e.type + '.png" height="45"/></th><th style="text-align: center;vertical-align: middle;"><p>' + e.fullname +
                        '</p><p> <small>' + dateformat(e.day, 'dd-mm-yyyy') + ' (' + e.schoolName + ')</small><p></th>';
                    html += '</tr>';
                });
                html += '</table>';
                const badgesNews = { id: -1, html: html, title: 'Last Badges', expires: null, order: 0 };
                d[0].results.unshift(badgesNews);
            }
            res.send(d[0].results);
        }).catch((d) => res.send([]));
    });
};
const newsDel = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = req.params;
        const sql = 'DELETE FROM news WHERE id=? LIMIT 1';
        const query = yield db_1.db.query(sql, [p.id || 0]);
        if (query.error || query.results.affectedRows <= 0) {
            res.send({ ok: false });
        }
        res.send({ ok: true });
    });
};
const newsUpdate = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = req.body;
        if (p.expires) {
            p.expires = '\'' + p.expires.split('.')[0].replace(/T/gi, ' ') + '\'';
        }
        else {
            p.expires = 'NULL';
        }
        let sql, objs;
        if (p.id > 0) {
            sql = 'UPDATE news SET expires=?, title=?, html=? WHERE id=?';
            objs = [p.expires, p.title, p.html, p.id];
        }
        else {
            sql = 'INSERT INTO news (expires, title, html) VALUES(?, ?, ?)';
            objs = [p.expires, p.title, p.html];
        }
        const query = yield db_1.db.query(sql, objs);
        if (query.error || query.results.affectedRows <= 0) {
            res.send({ ok: false });
        }
        res.send({ ok: true });
    });
};
const newsReorder = function (req, res) {
    const p = req.body;
    let pos = 0;
    const doAsync = function (b, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = 'UPDATE news SET `order`=' + b.pos + ' WHERE id=' + b.id;
            const query = yield db_1.db.query(sql);
            pos += 1;
            cb();
        });
    };
    async.map(p.order, doAsync, function () {
        res.send({});
    });
};
exports.newsPublicRouter = express_1.Router();
exports.newsAdminRouter = express_1.Router();
exports.newsPublicRouter.get('/list', newsList);
exports.newsAdminRouter.delete('/del/:id', newsDel);
exports.newsAdminRouter.post('/update', newsUpdate);
exports.newsAdminRouter.post('/reorder', newsReorder);
//# sourceMappingURL=news.router.js.map