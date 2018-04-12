
function processChart(name, data) {
    if(!data) {
        return {};
    }
    return charts[name](data);
}

const charts = {
    ratioVictoires: ratioVictoires,
};

function ratioVictoires(data) {
    return {};
}


module.exports = {
    processChart
}