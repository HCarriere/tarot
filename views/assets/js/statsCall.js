'use strict';

(function() {
    
    $(document).ready(function() {
        initStatsCall();
    });
    
    function initStatsCall() {
        $('.async-stats-player').on('click', function() {
            getPlayerStats({}, function(result) {
                console.log('result:'+result);
            });
        });
        
        $('.async-stats-group').each(function(i) {
            let div = $(this);
            getGroupStats({}, function(result) {
                // div.text(JSON.stringify(result.stats));
                for(let stat in result.stats) {
                    addStatLabel(stat, result.stats[stat]);
                }
                
                for(let chart of result.charts) {
                    addChart(div, chart);
                }
            });
        });
    }
    
    function getGroupStats(params, callback) {
        $.get('/stats/group', params)
        .done(callback)
        .fail(function(err) {
            console.log(err);
        });
    }
    
    function getPlayerStats(params, callback) {
        $.get('/stats/player/', params)
        .done(callback)
        .fail(function(err) {
            console.log(err);
        });
    }

    function addChart(div, chart) {
        let width = 400;
        let height = 400;
        if(chart.heightRatio) {
            height = width * chart.heightRatio;
        }
        let canvas = $('<canvas/>')
        .width(width)
        .height(height);
        let ctx = canvas[0].getContext('2d');
        div.append(canvas);
        
        setChart(chart.type, chart.data, chart.options, ctx);
    }
    
    function addStatLabel(name, stat) {
        let div = $('div[stat-name="'+name+'"]');
        if(typeof stat == 'object') {
            for(let part in stat) {
                div.children('.value[stat-part="'+part+'"]').text(stat[part]);
            }
        } else {
            div.children('.value').text(stat);
        }
    }
    
})();