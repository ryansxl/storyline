let Legend = function(el,data,scale,n) {
    this.data = data;
    this.element = el;
    this.scale = scale;
    this.lens_number = n;
    this.element.append("text").style("font-size","11px").style("position","absolute").style("top",10).style("left",0).text("Interactions:");
    this.draw();
}

Legend.prototype.draw = function() {
    // define width, height and margin
    this.height = 20;
    // console.log(this.element);
    var svg = this.element.append('svg')
      .attr('width',  "100%")
      .attr('height', this.height)
      .attr("class","legend");

    this.addCells(svg);
    svg.lower();
}

Legend.prototype.addCells = function(svg){
  const w = 13,
        g = svg.append("g").attr("class","legend-rect"),
        d = this.data,
        scale = this.scale;

  //in order to make scale continuous : 1.4.8 -> 1.2.3.4.5.6.7.8
  let data = [];
  for (let range_step= +d3.min(d); range_step<= +d3.max(d); range_step++) {
    data.push(range_step);
  }
  const cell = g.selectAll(".cell")
    .data(data)
    .enter().append("g").attr("class","cell");

  cell
    .append("rect")
    .attr("id",function(d,i){return i;})
    .attr('width', w)
    .attr('x',function(d,i){return i * w + 70;})
    .attr('y', 10)
    .attr('height', 10)
    .style('fill', function(d){
      return scale(d);
    })
    .style("stroke","#d3d3d3");

  cell
    .append("text")
    .attr('x', function(d,i){ return i * w + 70;})
    .attr('y', 10)
    .attr("dy", "-0.35em")
    .attr("dx", ".35em")
    .text(function(d){return d;})
    .style("font-size","9px");
}

/*
2D Legend
 */

let ContextLegend = function(el,data,scale,n) {
    el.select(".legend").remove();
    el.select("text").remove();

    this.data = data;
    this.element = el;
    this.scale = scale;
    this.lens_number = n;
    this.element.append("text").style("font-size","11px").style("position","absolute").attr("y",20).text("Interactions:");
    this.draw();
}

ContextLegend.prototype.draw = function() {
    // define width, height and margin
    this.height = 20;
    // console.log(this.element);
    var svg = this.element.append('svg')
      .attr('width',  "100%")
      .attr('height', this.height)
      .attr("class","legend");

    this.addCells(svg);
    svg.lower();
}

ContextLegend.prototype.addCells = function(svg){
  const w = 13,
        g = svg.append("g").attr("class","legend-rect"),
        d = this.data,
        scale = this.scale;

  //in order to make scale continuous : 1.4.8 -> 1.2.3.4.5.6.7.8
  let data = [];
  const integer_scale = d3.scaleLinear().domain(d3.extent(d)).range([0,d.length]);

  d.forEach(function(elm,i,ar){
    data.push(Math.round(integer_scale(elm)));
  });

  const cell = g.selectAll(".cell")
    .data(d)
    .enter().append("g").attr("class","cell");

  cell
    .append("rect")
    .attr("id",function(d,i){return i;})
    .attr('width', w)
    .attr('x',function(d,i){return i * w + 70;})
    .attr('y', 10)
    .attr('height', 10)
    .style('fill', function(d,i){
      return scale(d);
    })
    .style("stroke","#d3d3d3");

  cell
    .append("text")
    .attr('x', function(d,i){ return i * w + 70;})
    .attr('y', 10)
    .attr("dy", "-0.35em")
    .attr("dx", ".35em")
    .text(function(d,i){return data[i];})
    .style("font-size","9px");
}

class Trend{

  constructor(svg){
    this.lens_num = svg.attr("id").replace("analysis_view_","");
    this.div = d3.select("#analysis_view_div_"+this.lens_num);
    this.svg = svg;
  }

  show_trend_detection(svg,timestep_start,timestep_stop,h,w){
    const heatmap_data = this.get_heatmap_data(timestep_start,timestep_stop);
    const lens_num = svg.attr("id").replace("analysis_view_","");

    d3.select("#analysis_view_div_"+lens_num).add_range_annotations_mouseover(lens_num);

    this.create_heatmap(svg,heatmap_data,timestep_start,timestep_stop,h-10,w);
  };

  get_heatmap_data(timestep_start,timestep_stop){

    let value = 0;
    let filtered_entities = [];

    if(lense_lst[this.lens_num-1]){
      filtered_entities = lense_lst[this.lens_num-1].getFilterEntities();
    }
    else{
      filtered_entities = [];
    }

    const diff = characters.filter(x => filtered_entities.indexOf(x) < 0 );

    let entity_activity_data = [];
    let bubbles =  $.extend(true, [], _bubbleset_data);
    bubbles.forEach(function(d){
      let obj_start = {},
          obj_stop  = {};

      obj_start.group     = d.group;
      obj_start.character = d.character;
      obj_start.x         = parseInt(d.timestep_start);
      obj_start.y         = get_entity_y_value(d.character,+d.timestep_start);

      obj_stop.group      = d.group;
      obj_stop.character  = d.character;
      obj_stop.x          = parseInt(d.timestep_stop);
      obj_stop.y          = get_entity_y_value(d.character,+d.timestep_stop);

      if(diff.includes(d.character)) entity_activity_data.push(obj_start,obj_stop);
    });

    let data=[], pt={};
    for (let i = timestep_start; i <= timestep_stop; i++) {
      pt.x = i;
      pt.intensity = this.get_heatmap_value(i,entity_activity_data);
      data.push(pt);
      pt = {};
    }
    return data;

    function get_entity_y_value(character,x){
      let y = 0;
      _storyline_data.forEach(function(d){
        if(d.name == character){
          y = d[x];
        }
      })
      return y;
    };
  };

  get_heatmap_value(timestep,data){
    data = data.filter(function(d){
      return  +d.x == timestep;
    });

    return data.length;
  };

  create_heatmap(svg,data,timestep_start,timestep_stop,h,w){
    svg.select('.trend_x_axis').remove();
    svg.selectAll('.cell').remove();
    svg.select('#background').remove();
    svg.select('#close').remove();
    svg.selectAll('text').remove();
    svg.selectAll('image').remove();
    this.div.selectAll('.legend-container').remove();

    const x = d3.scaleLinear().range([0, w]).domain([timestep_start,timestep_stop]);

    svg.style("height",h*2+"px")

    let color_palette = [];

    $.each(data, function(i, el){
        if($.inArray(el.intensity, color_palette) === -1) color_palette.push(el.intensity);
    });
    color_palette = color_palette.sort((a, b) => a - b);

    const scale = d3.scaleSequential(d3.interpolateReds).domain([d3.min(color_palette), d3.max(color_palette)]);
    this.local_scale = scale;
    this.local_domain = [d3.min(color_palette), d3.max(color_palette)];

    this.cells = svg.selectAll('.cell')
        .data(data)
        .enter().append('rect')
        .attr('class', function(d){
          return 'cell _'+d.x;
        })
        .attr('width', w/(timestep_stop-timestep_start))
        .attr('height', h - 10)
        .attr('y', function(d) { return 0; })
        .attr('x', function(d) { return x(d.x); })
        .attr('fill', function(d) {
          return scale(d.intensity);
        })
        .on("mouseover",function(d){
          $(this).addClass("active");
          d3.select("#"+String(svg.attr("id")).replace("analysis_view_","analysis_view_div_")).select(".selection").text("Time: " + d.x + " -> " + d.intensity + " activity");
          timestep_main_chart(d.x);
        })
        .on("mouseout", function(d){
          hide_timesteps(d.x);
          d3.selectAll(".timestep-single").remove();
          d3.select("#"+String(svg.attr("id")).replace("analysis_view_","analysis_view_div_")).select(".selection").text(lense.placeholder_text);
          $(this).removeClass("active");
        });

    const lens_num = svg.attr("id").replace("analysis_view_","");
    const legend_container = d3.select("#" + 'analysis_view_div_'+lens_num).append("div").attr("class","legend-container").attr("id","legend-container_"+lens_num).style("width","40%");
    new Legend(legend_container,color_palette,this.local_scale,lens_num);
    this.color_palette = color_palette;

    if($('input[name=Global-Normalization]').prop('checked')){
      if(this.global_domain,this.global_palette) this.setToGlobal(this.global_domain,this.global_palette);
    }
  };

  getDomain(){
    return this.local_domain;
  }

  setToGlobal(domain,palette){
    this.div.selectAll('.legend-container').remove();

    const scale = d3.scaleSequential(d3.interpolateReds).domain(domain),
          lens_num = this.lens_num;

    this.cells
    .transition()
    .attr('fill', function(d) {
      return scale(d.intensity);
    });

    const legend_container = d3.select('#analysis_view_div_'+lens_num).append("div").attr("class","legend-container").attr("id","legend-container_"+lens_num).style("width","40%");
    new Legend(legend_container,palette,scale,lens_num);
    this.global_palette = palette;
    this.global_domain = domain;
  };

  setToLocal(){
    this.div.selectAll('.legend-container').remove();

    const local_domain = this.local_domain;
    const scale = d3.scaleSequential(d3.interpolateReds).domain(local_domain),
          lens_num = this.lens_num;

    this.cells
    .transition()
    .attr('fill', function(d) {
      return scale(d.intensity);
    });

    const legend_container = d3.select("#" + 'analysis_view_div_'+lens_num).append("div").attr("class","legend-container").attr("id","legend-container_"+lens_num).style("width","40%");
    new Legend(legend_container,this.color_palette,scale,lens_num);
  };

}// END Class Trend
