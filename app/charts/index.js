let gameCharts = require('./game');

const charts = {
    game: gameCharts,
}

function getChart(subject, chart, data) {
    if(charts[subject]) {
        return charts[subject].processChart(chart, data);
    }
}

module.exports = {
    getChart,
}