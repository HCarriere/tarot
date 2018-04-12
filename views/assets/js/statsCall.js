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
            getGroupStats({}, function(result) {
                console.log(result);
            });
        });
    }
    
    function getGroupStats(params, callback) {
        $.get('/stats/group', params)
        .done(callback)
        .fail(function(err) {
            console.log('raté mdr:'+err);
        });
    }
    
    function getPlayerStats(params, callback) {
        $.get('/stats/player/', params)
        .done(callback)
        .fail(function(err) {
            console.log('raté mdr:'+err);
        });
    }

})();