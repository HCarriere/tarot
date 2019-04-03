'use strict';

(function() {
    
    $(document).ready(function() {
        initStatsCall();
    });
    
    function initStatsCall() {
        $('.async-stats-player').on('click', function() {
            getPlayerStats({}, function(result) {
            });
        });
        
        $('.async-charts-group').on('click', function() {
            if($(this).attr('chart-lock') == 'true') {
                return;
            }
            $(this).attr('chart-lock', 'true');
            let div = $(this).next('.collapsible-body');
            getGroupChart($(this).attr('chart-name'), function(data) {
                addChart(div, data);
            });
        })
        
        $('.async-stats-group').each(function(i) {
            let div = $(this);
            getGroupStats({}, function(result) {
                // div.text(JSON.stringify(result.stats));
                for(let stat in result.stats) {
                    addStatLabel(stat, result.stats[stat]);
                }
            });
        });
        
        $('.hall-of-fame').each(function(i) {
            let div = $(this);
            $.get('/stats/group')
            .done(function(result) {
                for(let f in result.fames) {
                    // console.log(f+' -> ');
                    // console.log(result.fames[f])
                    let fame = `
                    <div class="fame">
                        <span class="new badge player left" data-badge-caption="${f}"></span>
                    `;
                    for(let badgeName in result.fames[f]) {
                        let badge = result.fames[f][badgeName];
                        fame+=   
                        `<span class="hf badge-description">
                            <div class="tooltipped" data-position="top" data-tooltip="${badge.description}${badge.gameName?' ('+badge.gameName+')':''}">
                                <div class="icon">
                                    <i class="material-icons">${badge.icon}</i>
                                </div>
                                <div class="name">
                                    ${badge.title}
                                </div>
                            </div>`
                            +(badge.gameId?`<a class="badge-link" href="/game/${badge.gameId}">
                                <i class="material-icons">link</i>
                            </a>`:'')+
                        `</span>
                        `;
                    }
                    fame+=`</div>`;
                    div.append(fame);
                }
                
                // post init
                colorPlayerBadges();
            })
            .fail(function(err) {
                console.log(err);
            });
        })
    }
    
    function getGroupChart(chart, callback) {
        $.get('/stats/chart/group/'+chart)
        .done(callback)
        .fail(function(err) {
            console.log(err);
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
        div.html(canvas);
        
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