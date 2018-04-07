const mongoose = require('mongoose');
const request = require('request');
const utils = require('./utils');
const Group = require('./group');
const Rules = require('./rules');

const gameSchema = mongoose.Schema({
    name: String,
    type: String,
    group: String,
    playersNumber: Number,
    players: [{
        name: String, 
        fake: Boolean, 
        score: Number,
    }],
    date: Date,
    rounds:[{
        playersScores: [{
            player: String,
            mod: Number,
        }],
        params: mongoose.Schema.Types.Mixed,
        won: Boolean,
        journal: [String],
    }],
});
const GameModel = mongoose.model('Game', gameSchema);

function find(arg, callback) {
    return GameModel.find(arg, callback);
}

function addGame(req, callback) {

    let params = utils.getRequestParams(req, [
        'name',
        'playersNumber',
        'players',
        'newPlayers'
    ]);
    let groupName = req.session.currentGroup;
    if(!groupName) return callback('Erreur non reconnue');

    // name
    let name = params.name || 'cool';
    // name = name.replace(' ','-');
    // players number
    let playersNumber = parseInt(params.playersNumber) || 5;
    // create new players
    let players = [];
    if(params.newPlayers) {
        let newPlayers = params.newPlayers.trim().split('|*^*|');
        for(let p of newPlayers) {
            players.push(p);
        }
    }
    // get selected players
    players = players.concat(params.players);
    // del empty
    players = players.filter((el)=>{return el!=null && el.trim().length > 0});
    // to upper
    players = players.map(val => val.toUpperCase());
    // doublons
    players = [ ...new Set(players)];

    // check player numbers
    if(players.length > playersNumber) {
        return callback('Trop de joueurs !');
    }

    // add players to group
    // Group.addPlayersToGroup(players, groupName); // WTF, TODO investiguer
    require('./group').addPlayersToGroup(players, groupName);

    // objectify players
    players = players.map(val => {return {
        name: val, 
        fake: false
    }});

    let newGame = new GameModel({
        name: name,
        type: 'tarot',
        group: groupName,
        playersNumber: playersNumber,
        players : players,
        date: new Date(),
    });
    newGame.save((err, object) => {
        if(err) {
            console.error(err);
        }
        callback(null, object);
    });
}

function getGame(id, groupName, callback) {
    GameModel.findById(id, (err, game) => {
        if(err) return console.error(err);
        if(!game) return callback('game does not exist');
        if(game.group != groupName) return callback('group does not belong to you');
        // if no enough player, populate with fake players
        if(game.players.length < game.playersNumber) {
            for(let i = game.players.length; i<game.playersNumber; i++) {
                game.players.push({
                    name: 'Joueur '+(i+1),
                    fake: true,
                });
            }
        }
        return callback(null, game);
    });
}

function getGames(filter, callback) {
    GameModel.find(filter, (err, games) => {
        if(err) return console.error(err);
        return callback(games);
    }).sort('date');
}

function addRoundToGame(req, callback, existingRoundId) {
    let params = utils.getRequestParams(req, [
        'gameId',
    ]);
    if(!params.gameId) {
        return callback('gameId is empty');
    }
    getGame(params.gameId, req.session.currentGroup, (err, game) => {

        if(err) return callback(err);
        Rules.applyRule(game, req, (err, round) => {
            // add round to game
            if(err) return callback(err);
            if(!round) return callback('erreur inconnue');
            if(!existingRoundId) {
                // add
                if(!game.rounds) {
                    game.rounds = [];
                }
                game.rounds.push(round);
            } else {
                // edit round
                for(let r in game.rounds) {
                    if(game.rounds[r]._id == existingRoundId) {
                        game.rounds[r] = round;
                    }
                }
            }

            // count each player score
            game.players = getScoresFromRounds(game.players, game.rounds);

            game.save((err, res) => {
                if(err) return console.error(err);
                return callback(err, res);
            });
            // return callback(err, game);
        });

    });
}

function editRoundFromGame(req, callback) {
    let params = utils.getRequestParams(req, [
        'existingRoundId',
    ]);
    if(!params.existingRoundId) {
        return callback('existingRoundId is empty');
    }
    addRoundToGame(req, (err, game) => {
        return callback(err, game);
    }, params.existingRoundId);
}

function getDefaultGameName(callback) {
    let url = 'http://fr.wikipedia.org/w/api.php?action=query&format=json&prop=&list=random&meta=&formatversion=1&rnnamespace=0&rnlimit=1&maxlag=5'; 
    request(url, (err, res, rawdata) => {
        if(err) {
            return callback('');
        } 
        let data = JSON.parse(rawdata);
        if(data && data.query && data.query.random) {
            return callback({
                title:data.query.random[0].title,
                id:data.query.random[0].id,
            });
        }
        console.log(JSON.stringify(data, null, 4));
        return callback('');
    });
}


function getScoresFromRounds(players, rounds) {
    let finalScore = [];
    for(let round of rounds) {
        for(let entry of round.playersScores) {
            if(!finalScore[entry.player]) {
                finalScore[entry.player] = 0;
            }
            finalScore[entry.player] += entry.mod;
        }
    }
    for(let player of players) {
        if(!player.score) {
            player.score = 0;
        }
        player.score = finalScore[player.name];
    }
    return players;
}


module.exports = {
    find,
    addGame,
    getGame,
    getGames,
    addRoundToGame,
    editRoundFromGame,
    getDefaultGameName,
    getScoresFromRounds,
};
