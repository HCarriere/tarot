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
            game: {},
        };
        let maxPts = {
            value: 0,
            player: '',
            game: {},
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
                            game: game,
                        };
                    }
                    if(score.mod < minPts.value) {
                        // min
                        minPts = {
                            value: score.mod,
                            player: score.player,
                            game: game,
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
                                giveBadgeToPlayer(players, score.player, BADGES.VARYS(game));
                            }
                            // petits bras
                            if(round.params.bouts && round.params.bouts.length == 3 
                               && round.params.contrat=="prise"
                               && round.params.score >= 70) {
                                giveBadgeToPlayer(players, score.player, BADGES.PETIT_BRAS(game));
                            }
                        }
                    } else {
                        playersStats[score.player].loseInCurrentGame += 1;
                    }
                    
                    if(round.params.player == score.player) {
                    // chelem
                        if(round.params.score == 91) {
                            giveBadgeToPlayer(players, score.player, BADGES.CHELEM(game));

                            // grand chelem
                            if(round.params.chelem) {
                                giveBadgeToPlayer(players, score.player, BADGES.GRAND_CHELEM(game));
                            }
                        } else {
                            // chelem raté
                            if(round.params.chelem) {
                                giveBadgeToPlayer(players, score.player, BADGES.FAIL(game));
                            }
                        }
                    }
                }
            }
            // reset game related stats
            for(let p in playersStats) {
                if(playersStats[p].winInCurrentGame >= 10) {
                    giveBadgeToPlayer(players, p, BADGES.PENTAKILL(game));
                }
                if(playersStats[p].loseInCurrentGame >= 10) {
                    giveBadgeToPlayer(players, p, BADGES.AMI_GREC(game));
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
        giveBadgeToPlayer(players, minPts.player, BADGES.MIN_SCORE(minPts.value, minPts.game));
        
        // max score
        giveBadgeToPlayer(players, maxPts.player, BADGES.MAX_SCORE(maxPts.value, maxPts.game));
        
        // exclude excluded players
        Group.find(groupName, (err, group) => {
            
            // utils.isPlayerExcluded(group, name)
            for(let p in players) {
                if(utils.isPlayerExcluded(group, p)) {
                    delete players[p];
                }
            }
            return callback({
                fames: players
            });
        });
        
    });
}

const BADGES = {
    MAX_SCORE: function(score, game) {
        return getBadge('Meilleur score', 'arrow_upward', 'A marqué '+score+' points lors d\'une partie', game);
    },
    MIN_SCORE: function(score, game) {
        return getBadge('Pire score', 'arrow_downward', 'A marqué '+score+' points lors d\'une partie', game);
    },
    GOKU: function() {
        return getBadge('Goku', 'star', 'IT\' OVER 9000!');
    },
    AIME: function() {
        return getBadge('L\'aimé', 'star_border', 'Etre en dessous de -4277 au classement général');
    },
    AMI_GREC: function(game) {
        return getBadge('L\'ami grec', 'replay_10', '10 défaites en une partie', game);
    },
    PENTAKILL: function(game) {
        return getBadge('Pentakill', 'forward_10', 'Gagner 10 rounds ou plus sur une partie à 5', game);
    },
    VARYS: function(game) {
        return getBadge('Lord Varys', 'invert_colors_off', 'Partir sans bout et gagner', game);
    },
    CHELEM: function(game) {
        return getBadge('Chelem', 'attach_money', 'Obtenir la totalité des points sur un round', game);
    },
    GRAND_CHELEM: function(game) {
        return getBadge('Grand Chelem', 'thumb_up', 'Annoncer et réussir un Grand Chelem', game);
    },
    FAIL: function(game) {
        return getBadge('Fail', 'thumb_down', 'Annoncer un Chelem et le rater', game);
    },
    PETIT_BRAS: function(game) {
        return getBadge('Petits bras', 'accessible', 'Tout les bouts, plus de 70 points, faire une petite.', game);
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


function getBadge(title, icon, description, game) {
    if(game) {
        return {
            title: title,
            icon: icon,
            description: description,
            gameName: game.name,
        }
    }
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