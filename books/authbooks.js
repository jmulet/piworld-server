const config = require('../server.config'),
    db = require('../mysql/db');

/*
* Creates a visualization entry in the database for the book access.
* Makes sure that creates a virtual logins id if not idLogins is passed
*/
const createVisualizationEntry = async function (idUser, ip, macbook, idLogins) {

    if (idUser < 0 || !macbook) {
        return;
    }

    const create = function (idLogin) {
        db.query("INSERT INTO visualization (idActivity, idAssignment, resource, vscore, vseconds, idLogins) VALUES(0,0,'book:" + macbook + "',10,1,'" + idLogin + "')");
    };

    if (!idLogins) {
        const query1 = await db.query("INSERT INTO logins (idUser,ip,parents,login) VALUES('" + idUser + "','" + (ip ||  "") + "',0,NOW())");
        create(query1.results.insertId);
    } else {
        create(idLogins);
    }
};

const authorizeBook = function (userinfo, bookId) {

    return new Promise(async (resolve) => {
        userinfo.id = userinfo.id || userinfo.idUser;
        const sql1 = "SELECT * FROM books WHERE bookCode='" + bookId + "'";
        const query1 = await db.query(sql1, [bookId || '']);
        if (query1.result.length === 0) {
            resolve(false);
        }

        const row = query1.results[0];
        if (row.allStudents || (row.allTeachers && userinfo.idRole < config.USER_ROLES.student)) {

            resolve(true);

        } else {
            let groupSearch = "";
            if (userinfo.groups) {
                groupSearch = " OR bu.idGroup IN (" + userinfo.groups + ") ";
            }

            const sql2 = "SELECT bu.id FROM books_user as bu INNER JOIN books as b on b.id=bu.idbook  where ( bu.idUser='" +
                userinfo.id + "' " + groupSearch + " ) " +
                " AND b.id='" + row.id + "' AND (bu.expires IS NULL OR NOW()<=bu.expires)";

            const query2 = await db.query(sql2);
            if (query2.results.length === 0) {
                resolve(false);
            }

            createVisualizationEntry(userinfo.id, "", bookId, userinfo.idLogin);
            resolve(true);
        }
    });
};

module.authorizeBook = authorizeBook;