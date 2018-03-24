const mongoose = require('mongoose');
const utils = require('./utils');

const groupSchema = mongoose.Schema({
    name: String,
    password: String,
    players: [{
        name: String,
        date: Date,
    }],
    games: [{
        name: String,
        id: String,
        players: [],
    }],
});
const GroupModel = mongoose.model('Group', groupSchema);

class Group {
    
    static get schema() {
        return groupSchema;
    }
    
    static get model() {
        return GroupModel;
    }
    
    static addGroup(req, callback) {
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
    
    static getGroup(groupName, callback) {
        let name = toGrpName(groupName);
        GroupModel.findOne({
            name: name,
        }, (err, result) => {
            if(err) return console.error(err);
            callback(err, result);
        });
    }
    
    static logonToGroup(req, callback) {
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
    
    static addPlayerToGroup(playerName, groupName) {
        if(!playerName || !groupName) {
            return;
        }
        GroupModel.findOne({
            name: toGrpName(groupName)
        }, (err, group) => {
            /* don't add doublons */
            if(group.players.every(el => {
                return el.name.toUpperCase() != playerName.toUpperCase();
            })) {
                group.players.push({
                    name: playerName.toUpperCase(),
                    date: new Date(),
                });
            }
            
            group.save((err, res) => {
                if(err) console.log(err);
            });
        });
    }
    
    static addGameToGroup(game, groupName) {
        GroupModel.findOne({
            name: toGrpName(groupName)
        }, (err, group) => {
            group.games.push({
                name: game.name,
                id: game._id,
                players: game.players,
            });
            
            group.save((err, res) => {
                if(err) console.log(err);
            });
        });
    }
}

function toGrpName(name) {
    return name.toUpperCase().trim();
}

module.exports = Group;