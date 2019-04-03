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
        corruption: Number,
        stats: {
            totalRoundsLost: Number,
            totalRoundsWon: Number,
        },
        badges: [{
            title: String,
            icon: String,
            description: String,
            gameName: String,
            gameId: String,
        }]
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
            group.players.sort((a, b) => {
                return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
            });
            callback({
                group: group,
                games: games,
                overallStats: getPlayerOverallStats(group),
            });
        });
    });
}

/**
 * Compute a group overall stats:
 * per (active) player:
 * - number of badges
 * - number of rounds
 * - victory ratio
 * @param {Group} group 
 */
function getPlayerOverallStats(group) {
    let stats = [];
    for(let player of group.players) {
        if(player.stats && (player.stats.totalRoundsLost > 0 || player.stats.totalRoundsWon > 0)) {
            stats.push({
                playerName: player.name,
                badgesCount: player.badges.length,
                roundsCount: player.stats.totalRoundsWon + player.stats.totalRoundsLost,
                victoryRatio: (player.stats.totalRoundsWon / 
                    (player.stats.totalRoundsWon+player.stats.totalRoundsLost)).toFixed(2),
            });
        }
    }
    return stats;
}

function getGroup(groupName, callback) {
    let name = toGrpName(groupName);
    GroupModel.findOne({
        name: name,
    }, (err, group) => {
        if(err) return console.error(err);
        group.players.sort((a, b) => {
            return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
        });
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

/**
 * Verify that the player exists
 * Get the games from which the player participated
 * Also get the player from the Group model
 * @param {Request} req 
 * @param {Function} callback(error, games, player(group))
 * @param {*} playersNumber tarot 4 or 5 ?
 * @param {*} disabled get disabled games
 */
function getAllGamesForPlayer(req, callback, playersNumber, disabled){
    let groupName = req.session.currentGroup;
    // verif player
    let playerName = req.params.player;
    let player;
    GroupModel.findOne({
        name: groupName,
    }, (err,group) => {
        if(err) {
            return callback(err);
        }

        player = group.players.find(p => p.name == playerName);
        if(!player) {
            return callback('player not found');
        }
         
        Game.getGames({
            group: groupName,
            playersNumber: playersNumber?playersNumber:5,// default 5
            $or:[{disabled: disabled?disabled:false}, {disabled: undefined}],
            players: {$elemMatch:{name:playerName}}
        }, games => {
            return callback(null, games, player);
        });
    });
}

/**
 * Update group badges from the hallofame processBadges function
 * Update
 * {
 * AAA: {BadgeA:{title: title,
            icon: icon,
            description: description,
            gameName: game.name,
            gameId: game.id,}, BadgeB:{...}}
 * }
 * @param {String} groupName
 * @param {Badges} stats from halloffame
 * @param {Function} callback 
 */
function updateGroupPlayersStats(groupName, stats, callback) {
    GroupModel.findOne({
        name: groupName,
    }, (err,group) => {
        if(err) {
            return callback(err);
        }
        for(let player of group.players) {
            if(stats.fames[player.name]) {
                player.badges = [];
                for(let badge in stats.fames[player.name].badges) {
                    player.badges.push(stats.fames[player.name].badges[badge]);
                }
                player.stats = stats.fames[player.name].stats;
            }
        }
        group.save((err, res) => {
            if(err) console.log(err);
            callback('OK');
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
    getAllGamesForPlayer,
    updateGroupPlayersStats,
};