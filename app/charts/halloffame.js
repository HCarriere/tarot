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
        
        let playersStats = {};
        
        for(let game of games) {
            for(let round of game.rounds) {
                for(let score of round.playersScores) {
                    if(score.mod > maxPts.value) {  
                        // max
                        maxPts = {
                            value: score.mod,
                            player: score.player,
                            gameName: game.name,
                        };
                    }
                    if(score.mod < minPts.value) {
                        // min
                        minPts = {
                            value: score.mod,
                            player: score.player,
                            gameName: game.name,
                        };
                    }
                    if(!playersStats[score.player]) {
                        playersStats[score.player] = {
                            totalScore: 0,
                            winInCurrentGame: 0,
                            loseInCurrentGame: 0,
                        };
                    }
                    playersStats[score.player].totalScore += score.mod;
                    if(hasWonRound(round, score.player)) {
                        playersStats[score.player].winInCurrentGame += 1;
                        if(round.params.player == score.player) {
                            // win without bout
                            if((!round.params.bouts || round.params.bouts.length == 0 )){
                                giveBadgeToPlayer(players, score.player, BADGES.VARYS());
                            }
                            // petits bras
                            if(round.params.bouts && round.params.bouts.length == 3 
                               && round.params.contrat=="prise"
                               && round.params.score >= 70) {
                                giveBadgeToPlayer(players, score.player, BADGES.PETIT_BRAS(game.name));
                            }
                        }
                    } else {
                        playersStats[score.player].loseInCurrentGame += 1;
                    }
                    
                    if(round.params.player == score.player) {
                    // chelem
                        if(round.params.score == 91) {
                            giveBadgeToPlayer(players, score.player, BADGES.CHELEM(game.name));

                            // grand chelem
                            if(round.params.chelem) {
                                giveBadgeToPlayer(players, score.player, BADGES.GRAND_CHELEM(game.name));
                            }
                        } else {
                            // chelem raté
                            if(round.params.chelem) {
                                giveBadgeToPlayer(players, score.player, BADGES.FAIL(game.name));
                            }
                        }
                    }
                }
            }
            // reset game related stats
            for(let p in playersStats) {
                if(playersStats[p].winInCurrentGame >= 10) {
                    giveBadgeToPlayer(players, p, BADGES.PENTAKILL());
                }
                if(playersStats[p].loseInCurrentGame >= 10) {
                    giveBadgeToPlayer(players, p, BADGES.AMI_GREC());
                }
                playersStats[p].winInCurrentGame = 0;
                playersStats[p].loseInCurrentGame = 0;
            }
        }
        for(let p in playersStats) {
            if(playersStats[p].totalScore > 9000) {
                giveBadgeToPlayer(players, p, BADGES.GOKU());
            }
            if(playersStats[p].totalScore < -4277) {
                giveBadgeToPlayer(players, p, BADGES.AIME());
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
    GOKU: function() {
        return getBadge('Goku', 'star', 'IT\' OVER 9000!');
    },
    AIME: function() {
        return getBadge('L\'aimé', 'star', 'Etre en dessous de -4277 au classement général');
    },
    AMI_GREC: function() {
        return getBadge('L\'ami grec', 'star', '10 défaites en une partie');
    },
    PENTAKILL: function() {
        return getBadge('Pentakill', 'star', 'Gagner 10 rounds ou plus sur une partie à 5');
    },
    VARYS: function() {
        return getBadge('Lord Varys', 'star', 'Partir sans bout et gagner');
    },
    CHELEM: function(gameName) {
        return getBadge('Chelem', 'star', 'Obtenir la totalité des points sur un round ('+gameName+')');
    },
    GRAND_CHELEM: function(gameName) {
        return getBadge('Grand Chelem', 'star', 'Annoncer et réussir un Grand Chelem('+gameName+')');
    },
    FAIL: function(gameName) {
        return getBadge('Fail', 'star', 'Annoncer un Chelem et le rater ('+gameName+')');
    },
    PETIT_BRAS: function(gameName) {
        return getBadge('Petits bras', 'star', 'Tout les bouts, plus de 70 points, faire une petite. ('+gameName+')');
    },
    /*SEASON_1ST: function() {
        return getBadge('As de pique', 'star', 'Vainqueur de la saison précédente');
    },
    SEASON_2ND: function() {
        return getBadge('As de carreaux', 'star', 'Second de la saison précédente');
    },
    SEASON_3RD: function() {
        return getBadge('As de trèfle', 'star', 'Troisième de la saison précédente');
    },
    VETERAN: function() {
        return getBadge('Vétéran', 'star', 'Vainqueur d\'une saison');
    },*/
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
    players[playerName][badge.title] = badge;
}

function hasWonRound(round, player) {
    if(round.params.called == player || round.params.player == player) {
        return round.won;
    } else {
        return !round.won;
    }
}

module.exports = {
    getGroupStats,
}