const mongoose = require('mongoose');
const utils = require('./utils');
const Group = require('./group');

const gameSchema = mongoose.Schema({
    name: String,
    group: String,
    playersNumber: Number,
    players: [String],
    date: Date,
});
const GameModel = mongoose.model('Game', gameSchema);

class Game {
    
    static addGame(req, callback) {
        let params = utils.getRequestParams(req, [
            'name',
            'playersNumber',
            'players',
            'newPlayers'
        ]);
        let groupName = req.session.currentGroup;
        if(!groupName) return callback('Erreur non reconnue');
        
        // name
        let name = params.name || 'Untitled';
        // players number
        let playersNumber = parseInt(params.playersNumber) || 5;
        // create new players
        let players = [];
        if(params.newPlayers) {
            let newPlayers = params.newPlayers.split(/[\s,;]+/);
            for(let p of newPlayers) {
                players.push(p);
                // add player to group
                Group.addPlayerToGroup(p, groupName);
            }
        }
        // get selected players
        players = players.concat(params.player);
        
        let newGame = new GameModel({
            name: name,
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
    
    static getGame(id, groupName, callback) {
        GameModel.findById(id, (err, game) => {
            if(err) return console.error(err);
            if(!game) return callback('game does not exist');
            if(game.group != groupName) return callback('group does not belong to you');
            return callback(null, game);
        });
    }
    
    static getGames(req, callback) {
        let params = utils.getRequestParams(req, [
            'groupName',
        ]);
        
        GameModel.find({
            group: params.groupName,
        }, (err, games) => {
            if(err) return console.error(err);
            return callback(null, games);
        });
    }
    
    static getRandomName() {
        let name = 'P';
        let allowedChars = 'AZERTYUIOPQSDFGHJKLMWXCVBN1234567890';
        for(let i = 0; i<5; i++) {
            name += allowedChars[Math.floor(Math.random()*allowedChars.length)];
        }
        return name;
    }
}

module.exports = Game;

/*

let game = new Game(groupName, {
    name: '',
    playerNumber: 5,
    players: [],
});


*/