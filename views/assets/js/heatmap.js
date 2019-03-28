'use strict';

(function() {
    

    $(document).ready(function() {
        
        $('.heatmap').each(function(i) {
            let id = $(this).attr('id');
            let values = JSON.parse($(this).attr('heatmap-data'));
            createHeatmap('#'+id, values);
        });
    });

    /**
    * element : string (DOM selector)
    * values : [int] (reconstructed into a planning by the client)
    * http://bl.ocks.org/ganezasan/dfe585847d65d0742ca7d0d1913d50e1
    */
    function createHeatmap(element, values) {
        let data = [];
        let days = ['Lundi', 'Mardi', 'Mecredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        let weeks = [];
        let weekMax = 0;
        for(let i=0; i<values.length; i++) {
            if(values[i]) {
                data.push({
                    day:(i+1)%7,
                    week:Math.floor((i+1)/7),
                    value: values[i],
                });
                if(Math.floor((i+1)/7)+1 > weekMax) {
                    weekMax = Math.floor(i/7)+1;
                }
            }
        }
        for(let w=1; w<=weekMax; w++) {
            weeks.push(w);
        }
        console.log(data)
        
        let width = 900,
            height = width / 7,
            cellSize = width / 52,
            margin = { top: 50, right: 0, bottom: 100, left: 70};
        
        let svg = d3.select(element)
            .append('svg')
            .attr('width',  width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let dayLabels = svg.selectAll('.dayLabel')
            .data(days)
            .enter().append('text')
            .text(function(d) {return d;})
            .attr('x', 0)
            .attr('y', (d, i) => i * cellSize)
            .style('text-anchor', 'end')
            .attr('transform', 'translate(-6,'+cellSize / 1.5+')')
            .attr("class", (d, i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

       
        let weekLabels = svg.selectAll(".weekLabel")
            .data(weeks)
            .enter().append("text")
            .text((d) => d)
            .attr("x", (d, i) => i * cellSize)
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + cellSize / 2 + ", -6)")
            .attr("class", (d, i) => ((i >= 7 && i <= 16) ? "weekLabel mono axis axis-worktime" : "weekLabel mono axis"));

        
        let colorScale = d3.scaleLinear().domain([-400, 400])
            .interpolate(d3.interpolateHcl)
            .range([d3.rgb('#FF0000'), d3.rgb('#00FF00')]);
        
    const heatmapChart = function(data) {

        let tip = d3.tip()
            .attr('class', 'd3-tip')
            .style("visibility","visible")
            .offset([0, 0])
            .html((d,i) => {
                let date = new Date();
                date.setMonth(0);
                date.setDate(data[i].week * 7 + data[i].day);
                return `<div class="heatmap-tooltip">
                            ${date.getDate()}/${date.getMonth()+1} : ${data[i].value}
                        </div>`
            });

        tip(svg.append("g"));
        
        const cards = svg.selectAll(".week")
            .data(data, (d) => d.day+':'+d.week);

        cards.append("title");

        cards.enter().append("rect")
            .attr("x", (d) => (d.week) * cellSize)
            .attr("y", (d) => (d.day) * cellSize)
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", "week bordered")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .attr("width", cellSize)
            .attr("height", cellSize)
            .style("fill", 'black')
            .merge(cards)
            .transition()
            .duration(1000)
            .style("fill", (d) => colorScale(d.value));

        cards.select("title").text((d) => d.value);

        cards.exit().remove();

    };

    heatmapChart(data);

        
    }
    
})();

/*


*/