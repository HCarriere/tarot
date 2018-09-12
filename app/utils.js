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

function getReadableDate(date) {
    function pad(n) {
        return n<10?'0'+n : n;
    }
    if(isSameDay(date)) {
        return `Aujourd'hui`;
    }
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if(isSameDay(date, yesterday)) {
        return 'Hier';
    }
    let name = `${pad(date.getDate())}-${pad(date.getMonth()+1)}-${date.getFullYear()}`;
    return name;
}

function isSameDay(date, date2) {
    if(!date2) {
        date2 = new Date();
    }
    if(date.setHours(0,0,0,0) == date2.setHours(0,0,0,0)) {
        return true;
    }
    return false;
}

function getSessionKey(grp, secret) {
    return md5(secret + '-' + grp + '==');
}

function getMonday(date) {
    date = new Date(date);
    let day = date.getDay();
    let diff = date.getDate() - day + (day == 0 ? -6:0); // adjust when day is sunday
    return new Date(date.setDate(diff));
}

function getStartOfMonth(date) {
    date = new Date(date);
    return new Date(date.getFullYear(), date.getMonth(), 1);
}


function isPlayerExcluded(group, playerName) {
    for(let player of group.players) {
        if(player.disabled && player.name == playerName) {
            return true;
        }
    }
    return false;
}

module.exports = {
    hashPassword,
    getRequestParams,
    setConnected,
    mustBeAuthentified,
    getReadableDate,
    getMonday,
    getStartOfMonth,
    isPlayerExcluded,
}