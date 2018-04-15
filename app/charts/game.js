
module.exports = {
    prisesParContrats,
    prisesParPersonnes,
    pointsParPersonnes,
};

function prisesParContrats(rounds) {
    let contrats = [];
    let stats = [];
    
    for(let round of rounds) {
        let contrat = round.params.contrat;
        if(contrats.indexOf(contrat) == -1){
            contrats.push(contrat);
        }
        let i = contrats.indexOf(contrat);
        stats[i] = stats[i]+1 || 1;
    }
    return {
        type: 'pie',
        data: {
            labels: contrats,
            datasets: [{
                data: stats
            }],
        },
        options: {
            plugins: {
                drawLabels: false,
            },
        },
        label: 'Prises par contrats',
    };
}

function prisesParPersonnes(rounds) {
    let persons = [];
    let stats = [];
    
    for(let round of rounds) {
        let person = round.params.player;
        if(persons.indexOf(person) == -1){
            persons.push(person);
        }
        let i = persons.indexOf(person);
        stats[i] = stats[i]+1 || 1;
    }
    
    return {
        type: 'bar',
        data: {
            labels: persons,
            datasets: [{
                data: stats,
                label: 'Nombre de contrats'
            }],
        },
        options: {
            plugins: {
                drawLabels: false,
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        },
        label: 'Prises par joueurs',
    };
}

function pointsParPersonnes(rounds) {
    let roundNames = [''];
    let datasets = [];
    let currentScores = [];
    let players = [];
    
    for(let i=0; i<rounds.length; i++) {
        roundNames.push('#'+i);
        for(let score of rounds[i].playersScores) {
            if(!currentScores[score.player]) {
                currentScores[score.player] = [0];
            }
            if(players.indexOf(score.player) == -1) {
                players.push(score.player);
            }
            let final = currentScores[score.player][i] + score.mod;
            currentScores[score.player].push(final);
        }
    }
    
    for(let p of players) {
        datasets.push({
            label: p,
            data: currentScores[p],
        });
    }
    
    return {
        type: 'line',
        data: {
            labels: roundNames,
           /* datasets: [
                {
                    data: [0,1,2],
                    label: 'J1',
                }
            ],*/
            datasets: datasets,
        },
        options: {
            plugins: {
                drawLabels: false,
            },
        },
        label: 'Points',
   };
}


