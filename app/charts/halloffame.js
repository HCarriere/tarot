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
        
        let players = {};
        
        // maximum / minimum de points en un tour
        let minPts = {
            value: 0,
            player: '',
            gameName: ''
        };
        let maxPts = {
            value: 0,
            player: '',
            gameName: ''
        };
        
        for(let game of games) {
            for(let round of game.rounds) {
                for(let score of round.playersScores) {
                    if(score.mod > maxPts.value) {
                        // max
                        maxPts = {
                            value: score.mod,
                            player: score.player,
                            gameName: game.name,
                        }
                    }
                    if(score.mod < minPts.value) {
                        // min
                        minPts = {
                            value: score.mod,
                            player: score.player,
                            gameName: game.name,
                        }
                    }
                }
            }
        }
        
        // min score
        giveBadgeToPlayer(players, minPts.player, BADGES.MIN_SCORE(minPts.value, minPts.gameName));
        
        // max score
        giveBadgeToPlayer(players, maxPts.player, BADGES.MAX_SCORE(maxPts.value, maxPts.gameName));
        
        return callback({
            fames: players
        });
    });
}

const BADGES = {
    MAX_SCORE: function(score, gameName) {
        return getBadge('Meilleur score', 'star', 'A marqué '+score+' points lors de la partie '+gameName);
    },
    MIN_SCORE: function(score, gameName) {
        return getBadge('Pire score', 'star', 'A marqué '+score+' points lors de la partie '+gameName);
    },
    AMI_GREC: function() {
        return getBadge('L\'ami grec', 'star', '10 défaites consécutives en une partie');
    },
    PENTAKILL: function() {
        return getBadge('Pentakill', 'star', 'Gagner 10 rounds ou plus sur une partie à 5');
    },
    VARYS: function() {
        return getBadge('Lord Varys', 'star', 'Partir sans bout et gagner');
    },
    SEASON_1ST: function() {
        return getBadge('As de pique', 'star', 'Vainqueur de la saison précédente');
    },
    SEASON_2ND: function() {
        return getBadge('As de carreaux', 'star', 'Second de la saison précédente');
    },
    SEASON_3RD: function() {
        return getBadge('As de trèfle', 'star', 'Triosième de la saison précédente');
    },
    VETERAN: function() {
        return getBadge('Vétéran', 'star', 'Vainqueur d\'une saison');
    },
    GOKU: function() {
        return getBadge('Goku', 'star', 'IT\' OVER 9000!');
    },
    AIME_GREC: function() {
        return getBadge('L\'aimé', 'star', 'Etre en dessous de -4277 au classement général');
    },
    CHELEM: function() {
        return getBadge('Chelem', 'star', 'Obtenir la totalité des points sur un round');
    },
    GRAND_CHELEM: function() {
        return getBadge('Grand Chelem', 'star', 'Annoncer et réussir un Grand Chelem');
    },
    FAIL: function() {
        return getBadge('Fail', 'star', 'Annoncer un Chelem et le rater');
    },
};


function getBadge(title, icon, description) {
    return {
        title: title,
        icon: icon,
        description: description,
    }
}

function giveBadgeToPlayer(players, playerName, badge) {
    if(!players[playerName]) {
        players[playerName] = {};
    }
    players[playerName][badge.name] = badge;
}

module.exports = {
    getGroupStats,
}