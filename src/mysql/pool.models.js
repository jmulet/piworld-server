const utils = require('./utils');
const models = {};

models.Activities = utils.define('activities', {
    id: {
        type: 'integer',
        primaryKey: true
    },
    levels: {
        type: 'string'
    },  
    idSubject: {
        type: 'integer',
        defaultValue: 1
    },  
    activity: {
        type: 'string'
    }, 
    activityType: {
        type: 'string',
        defaultValue: 'A',
        validate: {
            len: [0, 11]
        }
    },
    share: {
        type: 'integer',
        defaultValue: 2
    },  
    createdBy: {
        type: 'string',
        defaultValue: 'admin',
        validate: {
            len: [0, 255]
        }
    },  
    createdWhen: {
        type: 'date',
        defaultValue: 'NOW'
    },
    description: {
        type: 'string'
    },
    category: {
        type: 'string'
    },
    difficulty: {
        type: 'integer'
    },
    icon: {
        type: 'string',
        defaultValue: null,
        validate: {
            len: [0, 255]
        }
    },  
    ytid: {
        type: 'string',
        defaultValue: null,
        validate: {
            len: [0, 255]
        }
    },
    ytqu: {
        type: 'integer',
        defaultValue: 0
    }, 
    ggbid: {
        type: 'string',
        defaultValue: null
    },
    hasAct: {
        type: 'integer',
        defaultValue: 0
    },  
    createjs: {
        type: 'integer',
        defaultValue: 0 
    }, 
    counter: {
        type: 'integer',
        defaultValue: 0
    }
}, 
{
    timestamps: false
});

models.Logins = utils.define('logins', {    
    id: {
        type: 'integer',
        primaryKey: true
    },
    idUser: {
        type: 'integer'
    },
    parents: {
        type: 'integer',
        defaultValue: 0
    },
    ip: {
        type: 'string'
    },
    login: {
        type: 'date',
        defaultValue: 'NOW'
    },
    logout: {
        type: 'date'
    }
});

models.Users = utils.define('users', {
    id: {
        type: 'integer',
        primaryKey: true
    },
    idRole: {
        type: 'integer',
        defaultValue: 200
    },
    username: {
        type: 'string',
        validate: {
            len: [1, 255]
        }
    },
    fullname: {
        type: 'string',
        validate: {
            len: [1, 255]
        }
    },
    password: {
        type: 'string',
        validate: {
            len: [4, 255]
        }
    },
    passwordParents: {
        type: 'string'
    },
    mustChgPwd: {
        type: 'integer'
    },
    email: {
        type: 'string'
    },
    emailParents: {
        type: 'string'
    },
    phone: {
        type: 'string'
    },
    schoolId: {
        type: 'integer'
    },
    created: {
        type: 'date'
    },
    valid: {
        type: 'integer',
        defaultValue: 1
    },
    uopts: {
        type: 'string',
        defaultValue: '{}'
    }
});
 

module.exports = models;