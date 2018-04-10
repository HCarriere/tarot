'use strict';

(function(){
    

    $(document).ready(function(){

        // initialize all modals
        $('.modal').modal();

        // triggers
        $('.trigger-modal').modal();

        // collapsibles
        $('.collapsible').collapsible({
            accordion: false,
        });

        // chips
        $('.chips').chips();
        $('.new-player-selector').chips({
            placeholder: 'Entrer un nom',
            secondaryPlaceholder: '+Nom',
            onChipAdd: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*^*|'));
                $('#newPlayers').trigger('change');
            },
            onChipDelete: function(a) {
                $('#newPlayers').val(a[0].textContent.split('close').join('|*^*|'));
                $('#newPlayers').trigger('change');
            }
        });
        
        initScoreRange();
        
        initEditModal();
        
        initCharts();
        
        initNewGameValidator();
        
        colorPlayerBadges();
		
		initTour();
    });

    
    function initScoreRange() {
        
        function onScoreRangeUpdate(value, max) {
            $('#score_attk').text(value);
            $('#score_def').text(max - value);
        }
        
        let range = $('#score_range');
        
        range.on('input change', function(e){
            onScoreRangeUpdate(e.target.value, e.target.max)
        });
        
        $('#score_attk_add').on('click', function() {
            range.val(parseInt(range.val())+1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
        
        $('#score_def_add').on('click', function() {
            range.val(parseInt(range.val())-1);
            onScoreRangeUpdate(range[0].value, range[0].max)
        });
    }
    
    function initEditModal() {
        let elem = document.querySelector('.game-params-modal');
        let instance = M.Modal.init(elem);
        
        function resetGameParamsModal() {
            // checkbox
            $('.game-params-modal input[type="radio"], .game-params-modal input[type="checkbox"]').prop('checked', false);
            
            // button
            $('#modal-default-button').show();
            $('#modal-edit-button').hide();
            
            // round id
            $('input[name="existingRoundId"]').val('');
        }
        
        function setCheckboxesInput(selector, name, value) {
            let inputs = $(selector+' input[name="'+name+'"]');
            inputs.filter('[value="'+value+'"]').prop('checked', true);
        }
        
        
        $('.button-reset-game-params').on('click', function() {
            // reset modal
            resetGameParamsModal();
            // open modal
            instance.open();
        });
        
        
        $('.button-edit-game-params').on('click', function(e) {
            // reset modal
            resetGameParamsModal();
            
            // edit modal with current data
            let data = JSON.parse($(this).attr('current-data'));
            let id = $(this).attr('edit-id');
            
            for(let d in data) {
                if(Array.isArray(data[d])) {
                    for(let v of data[d]) {
                        setCheckboxesInput('.game-params-modal', d, v);
                    }
                } else {
                    setCheckboxesInput('.game-params-modal', d, data[d]);
                    if($('.game-params-modal input[name="'+d+'"]').attr('type') == 'range') {
                        $('.game-params-modal input[name="'+d+'"]').val(data[d]);
                    }
                }
            }
            $('#score_range').trigger('change');
            
            // change button
            $('#modal-default-button').hide();
            $('#modal-edit-button').show();
            
            // set current round id
            $('input[name="existingRoundId"]').val(id);
            
            // open modal
            instance.open();
        });
    }
    
    function initCharts() {
        // get charts
        
        $('canvas.chart').each(function(i) {
            let id = $(this).attr('id');
            let ctx = document.getElementById(id).getContext('2d');
            // let canvas= document.getElementById(id);
            let type = $(this).attr('chart-type');
            let data = JSON.parse($(this).attr('chart-data'));
            let options = JSON.parse($(this).attr('chart-options') || '{}');
                        
            if(data && type && data.datasets) {
                if(type == 'bar' || type == 'pie') {
                    // colors
                    for(let dataset of data.datasets) {
                        dataset.backgroundColor = [];
                        for(let key in dataset.data) {
                            dataset.backgroundColor.push(colors.fromSeed(data.labels[key]))
                        }
                    }
                } else if(type == 'line') {
                    for(let dataset of data.datasets) {
                        dataset.borderColor = colors.fromSeed(dataset.label);
                        dataset.lineTension= 0;
                        dataset.backgroundColor= 'transparent';
                    }
                }
                new Chart(ctx, {
                    type: type,
                    data: data,
                    options: options,
                });
            }
        });
        
        /*function getCyclicChartColor(i) {
            let colors = [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(50, 50, 212, 0.8)',
                'rgba(65, 212, 235, 0.8)',
                'rgba(45, 154, 50, 0.8)',
                'rgba(240, 50, 192, 0.8)',
                'rgba(158, 212, 50, 0.8)',
                'rgba(100, 50, 212, 0.8)',
            ];
            let val = Math.floor(i % colors.length);
            return colors[val];
        }*/
        
        
        
        
    }
    
    function initNewGameValidator() {
        let playerNumber = 0;
        let validPlayersNumber = 0;
        let block = false;
        
        setValidPlayersNumber();
        setPlayersNumber();
        $('#new-game-form input[name="playersNumber"]').on('change', function() {
            setValidPlayersNumber();
        });
        $('#new-game-form input[name="players"]').on('change', function() {
            setPlayersNumber();
        });
        
        function setValidPlayersNumber() {
            validPlayersNumber = $('#new-game-form input[name="playersNumber"]:checked').val();
            validatePlayersNumber();
        }
        
        function setPlayersNumber() {
            playerNumber = $('#new-game-form input[name="players"]:checked').length;
            validatePlayersNumber();
        }
        
        function validatePlayersNumber() {
            if(!block && playerNumber >= validPlayersNumber) {
                // block
                block = true; 
                $('#new-game-form input[name="players"]:not(:checked)').prop('disabled', true);
            }
            else if(block && playerNumber < validPlayersNumber) {
                // unblock
                block = false;
                $('#new-game-form input[name="players"]:not(:checked)').prop('disabled', false);
            }
        }
    }
    
    
    function colorPlayerBadges() {
        $('.badge.player').each( function(i) {
            let name = $(this).attr('data-badge-caption');
            $(this).css('background-color', colors.fromSeed(name));
        });
    }
    
    
	function initTour() {
		$('#double_misere input[name="double_misere"]:not(:checked)').prop("disabled", true);
		$('#misere input[name="misere"]').each( function(i) {
			let $this = $(this);
			let player = $(this).attr('value');
			$(this).on('change', function() {
				let check = $this.prop("checked");
				$(`#double_misere input[name="double_misere"][value="${player}"]`).prop("checked", false);
				$(`#double_misere input[name="double_misere"][value="${player}"]`).prop("disabled", !check);
			});
		});
	}
})();

let colors = (function() {
    const customColors = {
        HCE:'#0b1c00',
        BRT:'#ffa1fb',
		ADN:'#FFBE00',
    };
    
    function rand(seed) {
        /*let s = 0;
        for(let i=0; i<seed.length; i++) {
            s+=seed.charCodeAt(i)+(i+3);
        }
        while(s>1) {
            s /= 7;
        }
        s = s*0xFFFFFF<<2;
        return parseFloat('0.'+s); */
        let rng = new Math.seedrandom(seed);
        return rng.quick();
    }
    
    function fromSeed(seed) {
        if(customColors[seed]) {
            return customColors[seed];
        }
        let col = '#'+(rand(seed)*0xFFFFFF<<0).toString(16);
        while(col.length < 7) {
            col = col+'8';
        }
        col = col.substr(0, 7);
        col+='CC';
        customColors[seed] = col; // caching
        return col;
    }
    
    return {
        fromSeed,
    }
    
})();

