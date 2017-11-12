const authorizeBook = require('./authbooks').authorizeBook;

module.exports = function(app) {

    const authbooks = function (req, res) {
       var p = req.body;       
       authorizeBook(p, p.bookId).then( (d) => {
             res.send({okbook: d});        
       });
    };

    const authbookmgr = function (req, res) {
        var p = req.body;
  
        var err = function(){           
            if(p.method.indexOf("/list")>0)
            {
                res.send([]);
            }  else {
                res.send({ok: false});
            }         
        };
       
        var ok= function(d){
            if(p.method.indexOf("/list")>0)
            {
                res.send(d.result);
            } else {
                res.send({ok: d.result.insertId + d.result.affectedRows});
            }
        };
        
        var sql;
        var and = "";
        var prepared;
        if(p.method==="books/list"){
            var conditions="";
            if(p.id){
                conditions = " id='"+p.id+"' ";
                and = " AND ";
            }
            if(p.bookCode){
                conditions = and+" bookCode='"+p.bookCode+"' ";
            }
            
            sql = "SELECT * FROM books "+(conditions? " WHERE ": "") + conditions;
        } else  if(p.method==="books_user/list"){
            var conditions="";
            if(p.idbook){
                conditions = " idbook='"+p.idbook+"' ";
                and = " AND ";
            }
            if(p.idUser){
                conditions = and+" idUser='"+p.idUser+"' ";
            }
            if(p.idGroup){
                conditions = and+" idGroup='"+p.Group+"' ";
            }
            
            sql = "SELECT * FROM books_user "+(conditions? " WHERE ": "") + conditions;
        } else  if(p.method==="books/update"){    
            prepared = p.book; 
            delete prepared.edit;
            if(p.book.id){
                 sql = "UPDATE books SET ? WHERE id='"+p.book.id+"'";
                 delete prepared.id;
            } else {
                 sql = "INSERT INTO books (`bookCode`,`title`,`author`,`url`,`year`,`genre`,`img`,`key`,`allStudents`,`allTeachers`) VALUES ?";
                
            }
             
        } else  if(p.method==="books_user/update"){   
            
            //First get rid of all entries for this idbook
            var ok2 = function(){
                
                  //Create a batch for all entries to be inserted
                  var worker = function(bean, cb){
                        if(!bean.idUser && !bean.idGroup){
                            cb();
                            return;
                        }
                      
                        var iduser = bean.idUser? "'"+bean.idUser+"'" : "NULL";
                        var idgroup = bean.idGroup? "'"+bean.idGroup+"'" : "NULL";
                        //2017-08-23T22:00:00.000Z 
                         if(bean.expires){
                            bean.expires = "'"+bean.expires.split(".")[0].replace(/T/gi, " ")+"'";
                        } else {
                            bean.expires = "NULL";
                        }
                        sql = "INSERT INTO books_user (idbook, idUser, idGroup, expires) VALUES('"+p.idbook+"', "+iduser+", "+idgroup+","+bean.expires+")";
                        app.db.query(sql, cb, cb)();    
                  };
                  
                  async.mapLimit(p.list, 10, worker, function(){
                      res.send({ok: true});
                  });
            };
                    
            app.db.query("DELETE FROM books_user WHERE idbook='"+p.idbook+"'", ok2, err)();   
            
            return;
           
        }
        
        if(prepared){ 
              app.db.queryBatch(sql, prepared, ok, err)();    
        } else {
              app.db.query(sql, ok, err)();     
        }
    };

    app.post('/api/v1/admin/books', authbooks);
    app.post('/api/v1/admin/bookmgr', authbookmgr);    
};
