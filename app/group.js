const mongoose = require('mongoose');
const Game = require('./game');
const utils = require('./utils');

const groupSchema = mongoose.Schema({
    name: String,
    password: String,
    players: [{
        name: String,
        date: Date,
        disabled: Boolean,
    }],
});
const GroupModel = mongoose.model('Group', groupSchema);

function find(name, callback) {
    return GroupModel.findOne({
        name: name
    }, callback);
}

function addGroup(req, callback) {
    let params = utils.getRequestParams(req, ['name', 'password']);
    if(!params.name) {
        return callback('name is needed');
    }
    let name = toGrpName(params.name);
    GroupModel.findOne({
        name: name,
    }, (err, result) => {
        if(result) {
            // already exists
            return callback('group already exists');
        }
        let newGroup = new GroupModel({
            name: name,
            password: utils.hashPassword(params.password),
            players: [],
        });
        newGroup.save((err, object) => {
            if(err) console.error(err);
            callback(err, object);
        }); 
    });
}

function getGroupWithGames(groupName, callback, req) {
    let name = toGrpName(groupName);
    // {"date": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
    let dateFilter;

    if(req && req.query && req.query.month) {
        // month specified
        let monthStart = new Date(req.query.month);
        monthStart.setHours(0,0,0,0);
        let monthEnd = new Date(req.query.month);
        monthEnd.setHours(0,0,0,0);
        monthEnd.setMonth(monthStart.getMonth()+1);
        dateFilter = {$gte: monthStart, $lt: monthEnd};
    } else {
        // default (this week)
        let startOfWeek = utils.getMonday(new Date());
        dateFilter = {$gte: startOfWeek};   
    }
    GroupModel.findOne({
        name: name,
    }, (err, group) => {
        if(err) return console.error(err);
        getGamesFromGroup(group, dateFilter, (games) => {
            callback({
                group: group,
                games: games
            });
        });
    });
}

function getGroup(groupName, callback) {
    let name = toGrpName(groupName);
    GroupModel.findOne({
        name: name,
    }, (err, group) => {
        if(err) return console.error(err);
        callback(group);
    });
}

function logonToGroup(req, callback) {
    let params = utils.getRequestParams(req, [
        'name', 
        'password'
    ]);
    if(!params.name) {
        return callback('name is needed');
    }
    let name = toGrpName(params.name);

    GroupModel.findOne({
        name: name,
    }, (err, result) => {
        if(err) return console.error(err);
        if(!result) return callback('invalid group');
        if(result.password) {
            if(result.password == utils.hashPassword(params.password)) {
                // good password
                return callback(null, result);
            } else {
                // bad password
                return callback('wrong password');
            }
        }
        return callback(null, result);
    });
}

function addPlayersToGroup(players, groupName) {
    console.log(groupName+' got new players : '+JSON.stringify(players));
    if(!players || !groupName) {
        return;
    }
    GroupModel.findOne({
        name: toGrpName(groupName)
    }, (err, group) => {
        /* don't add doublons */

        for(let player of players) {
            if(group.players.every(el => {
                return el.name.toUpperCase().trim() 
                != player.toUpperCase().trim();
            })) {
                group.players.push({
                    name: player.toUpperCase().trim(),
                    date: new Date(),
                });
            }
        }

        group.save((err, res) => {
            if(err) console.log(err);
        });
    });
}


function toGrpName(name) {
    return name.toUpperCase().trim();
}

function getGamesFromGroup(group, filter, callback) {
    Game.getGames({
        group: group.name,
        date: filter,
    }, games => {
        // by days
        let datesAssoc = {};
        let dates = [];
        for(let game of games) {
            let d = utils.getReadableDate(game.date);
            if(!datesAssoc[d]) datesAssoc[d] = {realDate:game.date, games:[]};
            datesAssoc[d].games.unshift(game);
        }
        
        for(let d in datesAssoc) {
            dates.push({
                date: d,
                realDate: datesAssoc[d].realDate,
                games: datesAssoc[d].games,
            });
        }
        dates.sort((a,b) => {
            return b.realDate - a.realDate;
        });
        
        callback(dates);
    });
}

function setActivePlayers(req, callback) {
    let groupName = req.session.currentGroup;
    if(!groupName || !req.body) {
        return callback('Bad parameters');
    }
    let playersToInclude = req.body.playersToInclude || [];
    GroupModel.findOne({
        name: groupName,
    }, (err,group) => {
        if(err) {
            return callback(err);
        }
        for(let player of group.players) {
            if(!playersToInclude.includes(player.name)) {
                // set player as "disabled"
                player.disabled = true;
            } else {
                player.disabled = false;
            }
        }
        group.save((err, res) => {
            if(err) console.log(err);
            callback();
        });
    });
}

module.exports = {
    find,
    addGroup,
    getGroupWithGames,
    getGroup,
    logonToGroup,
    addPlayersToGroup,
    setActivePlayers,
};