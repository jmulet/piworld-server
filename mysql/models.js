const Sequelize = require('sequelize');
const sequelize = require('./sequelize');
const models = {};

models.Activities = sequelize.define('activities', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    levels: {
        type: Sequelize.TEXT
    },  
    idSubject: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },  
    activity: {
        type: Sequelize.TEXT
    }, 
    activityType: {
        type: Sequelize.TEXT,
        defaultValue: 'A',
        validate: {
            len: [0, 11]
        }
    },
    share: {
        type: Sequelize.INTEGER,
        defaultValue: 2
    },  
    createdBy: {
        type: Sequelize.TEXT,
        defaultValue: 'admin',
        validate: {
            len: [0, 255]
        }
    },  
    createdWhen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    description: {
        type: Sequelize.TEXT
    },
    category: {
        type: Sequelize.TEXT
    },
    difficulty: {
        type: Sequelize.INTEGER
    },
    icon: {
        type: Sequelize.TEXT,
        defaultValue: null,
        validate: {
            len: [0, 255]
        }
    },  
    ytid: {
        type: Sequelize.TEXT,
        defaultValue: null,
        validate: {
            len: [0, 255]
        }
    },
    ytqu: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }, 
    ggbid: {
        type: Sequelize.TEXT,
        defaultValue: null
    },
    hasAct: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },  
    createjs: {
        type: Sequelize.INTEGER,
        defaultValue: 0 
    }, 
    counter: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
}, 
{
    timestamps: false
});

model.Logins = sequelize.define('logins', {    
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    idUser: {
        type: Sequelize.INTEGER
    },
    parents: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    ip: {
        type: Sequelize.STRING
    },
    login: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    logout: {
        type: Sequelize.DATE
    }
},
{
    timestamps: false
})

models.Users = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    idRole: {
        type: Sequelize.INTEGER,
        defaultValue: 200
    },
    username: {
        type: Sequelize.TEXT,
        validate: {
            len: [1, 255]
        }
    },
    fullname: {
        type: Sequelize.TEXT,
        validate: {
            len: [1, 255]
        }
    },
    password: {
        type: Sequelize.TEXT,
        validate: {
            len: [4, 255]
        }
    },
    passwordParents: {
        type: Sequelize.TEXT
    },
    mustChgPwd: {
        type: Sequelize.INTEGER
    },
    email: {
        type: Sequelize.TEXT
    },
    emailParents: {
        type: Sequelize.TEXT
    },
    phone: {
        type: Sequelize.TEXT
    },
    schoolId: {
        type: Sequelize.INTEGER
    },
    created: {
        type: Sequelize.DATE
    },
    valid: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    uopts: {
        type: Sequelize.TEXT,
        defaultValue: '{}'
    }
}, 
{
    timestamps: false
});
 

module.exports = models;