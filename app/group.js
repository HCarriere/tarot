const mongoose = require('mongoose');
const utils = require('./utils');

const groupSchema = mongoose.Schema({
    name: String,
    password: String,
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
        GroupModel.findOne({
            name: params.name,
        }, (err, result) => {
            if(result) {
                // already exists
                return callback('group already exists');
            }
            let newGroup = new GroupModel({
                name: params.name,
                password: utils.hashPassword(params.password),
            });
            newGroup.save((err, object) => {
                if(err) console.error(err);
                callback(err, object);
            }); 
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
        
        GroupModel.findOne({
            name: params.name,
        }, (err, result) => {
            if(err) return console.error(err);
            if(result.password) {
                if(result.password == utils.hashPassword(params.password)) {
                    // good password
                    return callback(result);
                } else {
                    // bad password
                    return callback(false);
                }
            }
            return callback(result);
        });
    }
    
    static addPlayerToGroup(playerName, groupName) {
        GroupModel.findOne({
            name: groupName
        }, (err, group) => {
            let player = {
                name: playerName,
                date: new Date(),
            };
            if(!group.players) {
                group.players = [player];
            } else {
                group.players.push(player);
            }
            group.save((err, res) => {
                
            });
        });
    }
}

module.exports = Group;