const Game = require('../game');
const utils = require('../utils');
const Group = require('../group');

function getGroupStats(groupName, callback) {
    let stats = {};
   // let charts = [];
    
    Game.find({
        group: groupName,
        $or:[{disabled: false}, {disabled: undefined}],
    }, (err, games) => {
        if(err) {
            return callback({err: 'erreur de type erreur.'});
        }
        if(games.length==0) {
            return callback({err: 'pas de stats'});
        }
        
        let badges = {};
        let fames = {};
        
        // maximum / minimum de points en un tour
        let maxPts = 0;
        let minPts = 0;
        for(let game of games) {
            for(let round of game.rounds) {
                for(let score of round.playersScores) {
                    if(score.mod > maxPts) {
                        // max
                        badges['MAX_SCORE'] = {
                            player: score.player,
                            badge: BADGES.MAX_SCORE(score.mod, game)
                        };
                        maxPts = score.mod;
                    }
                    if(score.mod < minPts) {
                        // min
                        badges['MIN_SCORE'] = {
                            player: score.player,
                            badge: BADGES.MIN_SCORE(score.mod, game)
                        };
                        minPts = score.mod;
                    }
                }
            }
        }
        
        for(let badge in badges) {
            if(!fames[badges[badge].player]) {
                fames[badges[badge].player] = [];
            }
            fames[badges[badge].player].push(badges[badge].badge);
        }
        
        return callback({
            fames: fames
        });
    });
}

const BADGES = {
    MAX_SCORE: function(score, game) {
        return getBadge('Meilleur score', 'star', 'A marqué '+score+' points lors de la partie '+game.name);
    },
    MIN_SCORE: function(score, game) {
        return getBadge('Pire score', 'star', 'A "gagné" '+score+' points lors de la partie '+game.name);
    },
};

function getBadge(name, icon, description) {
    return {
        name: name,
        icon: icon,
        description: description,
    }
}

module.exports = {
    getGroupStats,
}