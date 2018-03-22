const md5 = require('md5');

function hashPassword(password) {
    if(!password) {
        return null;
    }
    return md5(password);
}

// getRequestParams(req, params)
function getRequestParams(req, params) {
    let resolvedParams = [];
    
    if(!req.body || req.body.length == 0) {
        return [];
    } 
    // required
    for(let p of params) {
        if(req.body[p]) {
            resolvedParams[p] = req.body[p];
        }
    }
    return resolvedParams;
}

function setConnected(req, sessionSecret, groupName) {
    if(!groupName) return;
    console.log('connected as '+groupName);
    req.session.currentGroup = groupName;
    req.session.sessionID = getSessionKey(sessionSecret, groupName);
}


function mustBeAuthentified(secret) {
    return function (req, res, next) {
        if(req.session.currentGroup &&
          getSessionKey(secret, req.session.currentGroup) == req.session.sessionID) {
            return next()
        }
        res.redirect('/login');
    }
}


function getSessionKey(grp, secret) {
    return md5(secret + '-' + grp + '==');
}

module.exports = {
    hashPassword,
    getRequestParams,
    setConnected,
    mustBeAuthentified,
}