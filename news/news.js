const async = require('async');


module.exports = function (app) {

    const newsList = async function (req, res) {
        var p = req.body;

        var sql1 = "SELECT * FROM news";
        if (p.filter) {
            sql += " WHERE expires IS NULL OR expires>=NOW()";
        }
        sql += " ORDER BY `order` ASC, id DESC";

        const promises = [db.query(sql1)];

        // If badges key present show a news with last granted badges
        
        if (p.badges) {
            const sql2 = "SELECT b.*, u.fullname, s.schoolName FROM badges as b INNER JOIN users as u on u.id=b.idUser INNER JOIN schools as s on s.id=u.schoolId WHERE b.day >= (NOW() - INTERVAL 10 DAY) AND b.type < 200 ORDER BY `day` DESC, b.type ASC, u.fullname ASC LIMIT 4 ";
            promises.push(db.query(sql2));
        }

        Promise.all(promises).then((d1, d2) => {

            if (d2 && d2.results.length) {
                var html = "<p>Darreres <b>Insígnies</b> aconseguides:</p><table class='table'>";
                d2.results.forEach( (e) => {
                    html += "<tr>";
                    html += "<th style='width:100px;text-align: right;vertical-align: middle;'><img src='assets/img/badge-" + e.type + ".png' height='45'/></th><th style='text-align: center;vertical-align: middle;'><p>" + e.fullname +
                        "</p><p> <small>" + dateformat(e.day, "dd-mm-yyyy") + " (" + e.schoolName + ")</small><p></th>";
                    html += "</tr>";
                });
                html += "</table>";
                var badgesNews = { id: -1, html: html, title: "Last Badges", expires: null, order: 0 };
                d1.results.unshift(badgesNews);
            }

            res.send(d1.results);
        }).catch( (d) => res.send([]) ); 
    };


    const newsDel = async function (req, res) {
        const p = req.body;
        const sql = "DELETE FROM news WHERE id='" + p.id + "' LIMIT 1";       
        const query = await db.query(sql);
        if (query.error || query.results.affectedRows <=0 ) {
            res.send({ok: false});
        }
        res.send({ok: true});
    };

    const newsUpdate = async function (req, res) {

        const p = req.body;
        if (p.expires) {
            p.expires = "'" + p.expires.split(".")[0].replace(/T/gi, " ") + "'";
        } else {
            p.expires = "NULL";
        }

        let sql, objs;
        if (p.id > 0) {
            sql = "UPDATE news SET expires=?, title=?, html=? WHERE id=?";
            objs = [p.expires, p.title, p.html, p.id];

        } else {
            sql = "INSERT INTO news (expires, title, html) VALUES(?, ?, ?)";
            objs = [p.expires, p.title, p.html];
        }


        const query = await db.query(sql, objs);
        if (query.error ||  query.results.affectedRows <= 0) {
            res.send({ ok: false });
        }
        res.send({ ok: true });

    };

    const newsReorder = function (req, res) {
        var p = req.body;
        var pos = 0;

        var doAsync = await function (b, cb) {
            var sql = "UPDATE news SET `order`=" + b.pos + " WHERE id=" + b.id;
            const query = await db.query(sql);
            pos += 1;
            cb();
        };

        async.map(p.order, doAsync, function () {
            res.send({});
        });
    };

    app.post('/api/v1/admin/news/list', newsList);
    app.post('/api/v1/admin/news/del', newsDel);
    app.post('/api/v1/admin/news/update', newsUpdate);
    app.post('/api/v1/admin/news/reorder', newsReorder);
};