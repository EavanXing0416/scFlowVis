// 设置 SVG 尺寸和 viewBox
const width = 720;
const height = 590;

// 检查 #adataSvgContainer 是否已经包含一个 SVG 元素, if not, delete the existing one and create a new one
if (!d3.select('#adataSvgContainer').select('svg').empty()) {
    d3.select('#adataSvgContainer').select('svg').remove();
}
// 创建一个新的 SVG 容器
const svg = d3.select('#adataSvgContainer').append('svg')
.attr('width', '100%') // 使用百分比使 SVG 具有响应性
.attr('height', '100%')
.attr('viewBox', `0 0 ${width} ${height}`)
.attr('preserveAspectRatio', 'xMidYMid meet');
// 定义 AnnData 组件的尺寸和位置
var components = [
    { id: 'X', x: 280, y: 120, width: 300, height: 200, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'obs', x: 590, y: 120, width: 100, height: 200, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'var', x: 280, y: 10, width: 300, height: 100, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'obsm', x: 170, y: 120, width: 100, height: 200, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'varm', x: 280, y: 330, width: 300, height: 100, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'uns', x: 55, y: 390, width: 150, height: 150, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'obsp', x: 10, y: 120, width: 150, height: 200, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
    { id: 'varp', x: 280, y: 440, width: 300, height: 130, fill: 'lightgrey', stroke: 'black', strokeWidth: 1, desc: 'No Node Chosen' },
];

// 创建一个 tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// 绘制矩形和文本标签
components.forEach(component => {
    var g = svg.append('g');

    var rect = g.append('rect')
        .attr('id', component.id)
        .attr('x', component.x)
        .attr('y', component.y)
        .attr('width', component.width)
        .attr('height', component.height)
        .attr('fill', component.fill)
        .attr('stroke', component.stroke)
        .attr('stroke-width', component.strokeWidth);
        
    if (component.id === 'uns') {
        rect.attr('rx', 50); // 
    }
    
    var text = g.append('text')    
        .attr('x', component.x + component.width / 2) // 水平居中
        .attr('y', component.y + component.height / 2 +10) // 在矩形上方一点位置
        .attr('text-anchor', 'middle') // 使文本居中
        .text(component.id)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '36px')
        .attr('fill', 'black');

    
    rect.on('mouseover', function(event) {
        d3.select(this)
            .transition() // Start a transition
            .duration(200) // For 200 milliseconds
            .attr('width', component.width * 1.05) // Increase width
            .attr('height', component.height * 1.05) // Increase height
            .attr('x', component.x - component.width * 0.025) // Move left
            .attr('y', component.y - component.height * 0.025); // Move up

        // Show tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        tooltip.html(`${component.id} description: <br><i>${component.desc.split(',').join('<br>')}</i>`) // Set tooltip content to the id of the hovered rect
            .style('left', (d3.pointer(event, window)[0]) + 'px')
            .style('top', (d3.pointer(event, window)[1] - 28) + 'px');
    });
    rect.on('mouseout', function() {
        d3.select(this)
            .transition() // Start a transition
            .duration(200) // For 200 milliseconds
            .attr('width', component.width) // Return to original width
            .attr('height', component.height) // Return to original height
            .attr('x', component.x) // Move right
            .attr('y', component.y); // Move down

        // Hide tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', 0);

    });

    text.on('mouseover', function(event) {
        d3.select(this)
            .transition() // Start a transition
            .duration(200) // For 200 milliseconds
            .attr('font-size', '38px'); // Increase font size

            // Show tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        tooltip.html(`${component.id} description: <br><i>${component.desc.split(',').join('<br>')}</i>`) // Set tooltip content to the id of the hovered rect
            .style('left', (d3.pointer(event, window)[0]) + 'px')
            .style('top', (d3.pointer(event, window)[1] - 28) + 'px');
    })
    .on('mouseout', function() {
        d3.select(this)
            .transition() // Start a transition
            .duration(200) // For 200 milliseconds
            .attr('font-size', '36px'); // Return to original font size

            // Hide tooltip
        tooltip.transition()
            .duration(200)
            .style('opacity', 0);
    });


});

// 为了示例，这里只添加了 X 和 obs 两个组件。
// 你需要为图中显示的每个组件添加相应的代码块。

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//statusCheck Node
function statusNode() {
    this.addInput("adata", "string");
    //this.addOutput("file being checked", "string");
    this.properties = { filename: ""}; 
    this.color = "#5F5B52";
    this.size = [80, 40];
}

statusNode.title = "Check";

statusNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('statusNode input data:', filename);
            if (filename) {
                this.runStatus(filename);
                this.setOutputData(0, filename);
            }
        }, 100);
    }else{
        console.log('link not connected');
         // If statusNode is not connected to any node, revert all rects to light gray
        d3.selectAll('rect').attr('fill', 'lightgray');
        components.forEach(components => {
                components.desc = 'No Node Chosen';
        });
        // Remove the accordion
        d3.select('#accordionList').remove();
    }
};

statusNode.prototype.runStatus = function(filename) {
    console.log(components);
    
    this.properties.filename = filename;
    //this.background = "#AAF";
    fetch('/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            throw new Error(data.error);
        } else {
            console.log('statusNode output:', data)

            // Check if obj key in data matches any rect ID
            d3.selectAll('rect').each(function() {
                var rect = d3.select(this);
                if (Object.keys(data[0]).includes(rect.attr('id'))
                    ) {
                    // Change fill color of the matching rect
                    rect.attr('fill', '#9ebcda');

                    // Update desc in components array
                    components.forEach(components => {
                        if (components.id === rect.attr('id')) {
                            components.desc = data[0][rect.attr('id')];
                        }
                    });
                }
            });

            // Create the accordion
            // Group data[1] by adata_key
            var groupedData = {};
            Object.values(data[1]).forEach(item => {
                if (!groupedData[item.adata_key]) {
                    groupedData[item.adata_key] = [];
                }
                groupedData[item.adata_key].push(item);
            });

            // Create the accordion
            // Check if container is already present, if so, remove it
            if (!d3.select('#accordionList').empty()) {
                d3.select('#accordionList').remove();
            }
        
            var accordion = d3.select('#adataDescContainer').append('div')
                .attr('class', 'accordion')
                .attr('id', 'accordionList');

            // For each key in groupedData
            Object.keys(groupedData).forEach((key, index) => {
                // Create a card
                var card = accordion.append('div')
                    .attr('class', 'card');

                // Create the card header
                var cardHeader = card.append('div')
                    .attr('class', 'card-header')
                    .attr('id', `heading${index}`);
                cardHeader.append('p')
                    .attr('class', 'mb-0')
                    .append('button')
                        .attr('class', 'btn btn-link menubtn')
                        .attr('type', 'button')
                        .attr('data-toggle', 'collapse')
                        .attr('data-target', `#collapse${index}`)
                        .attr('aria-expanded', 'true')
                        .attr('aria-controls', `collapse${index}`)
                        .text(key);

                // Create the collapse
                var collapse = card.append('div')
                    .attr('class', 'collapse')
                    .attr('id', `collapse${index}`)
                    .attr('aria-labelledby', `heading${index}`)
                    .attr('data-parent', '#accordionList');
                var cardBody = collapse.append('div')
                    .attr('class', 'card-body');
                
                // Create a table in the card body
                let table = cardBody.append('table');
                let thead = table.append('thead');
                let tbody = table.append('tbody');
                
                // append the header row
                thead.append('tr')
                    .selectAll('th')
                    .data(['key', 'type', 'dim', 'chart tips'])
                    .enter()
                    .append('th')
                    .text(function (column) { return column; });
                
                // create a row for each object in the data
                let rows = tbody.selectAll('tr')
                    .data(groupedData[key])
                    .enter()
                    .append('tr');

                // create a cell in each row for each column
                let cells = rows.selectAll('td')
                    .data(function (row) {
                        //return ['adata_subkey', 'data_type', 'dim'].map(function (column) {
                        let values = ['adata_subkey', 'data_type', 'dim'].map(function (column) {    
                            return {column: column, value: row[column]};
                        });
                        // Add an extra value for vis-recommandation column
                        values.push({column: 'chart tips', value: ''});
                        return values;
                    })
                    .enter()
                    .append('td')
                    .each(function (d,i) { 
                        if (i<3){
                            d3.select(this).text(d.value);
                        } else {
                            d3.select(this)
                                .append('img')
                                .attr('class', 'hint-btn')
                                .attr('src', '../static/image/icons/idea.png')
                                .style('transition', 'transform 0.2s') // Smooth transition
                                .on('mouseover', function() {
                                    d3.select(this).style('transform', 'scale(1.25)'); // Scale up on mouseover
                                })
                                .on('mouseout', function() {
                                    d3.select(this).style('transform', 'scale(1)'); // Scale down on mouseout
                                })
                                .on('click', function() {
                                    //get the data for the current row
                                    var rowData = d3.select(this.parentNode.parentNode).datum();
                                    console.log('currentRow:', rowData);

                                    // Check the current color of the image
                                    var currentColor = d3.select(this).style('background-color');
                                    console.log('currentColor:', currentColor);

                                    if (currentColor === 'khaki') {
                                        // If the color is yellow, call withdrawVisRec and change the color back
                                        withdrawVisRec();
                                        d3.select(this).style('background-color', ''); // Change the color back
                                    } else {
                                        // Otherwise, call visRecommend and change the color to yellow
                                        visRecommend(rowData.data_type, rowData.dim);
                                        d3.select(this).style('background-color', 'khaki'); // Change the color to yellow
                                    }
                                    
                                });
                        }  
                    });

                // Add each item in the group to the card body
                //groupedData[key].forEach(item => {
                //    cardBody.append('p')
                //        .text(`key: ${item.adata_subkey}, type: ${item.data_type}, dim: ${item.dim}`);
                //});
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.background = "#F99";
    });
};

/**
statusNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
}
 */
LiteGraph.registerNodeType("scanpy/data/status", statusNode);

//////////////////////// Data Check LInk to Vis Recommandation ////////////////////////
visRecommend = function(data_type, dim){
    console.log('visRecommend called');
    console.log('data_type:', data_type);
    console.log('dim:', dim);
    var type_in_use
    var dim_in_use
    if (data_type === 'int32' || data_type === 'float32' || data_type === 'int64' || data_type === 'float64') {
        type_in_use = 'numerical';
    }else if (data_type === 'category' || data_type === 'bool') {
        type_in_use = 'categorical';
    }else if (data_type === 'object' || data_type === 'dict') {
        type_in_use = 'object';
    }else {
        type_in_use = 'others';
    }

    if (dim.length === 1) {
        dim_in_use = '1D';
    }else if (dim[1] === 2) {
        dim_in_use = '2D';
    }else if (dim[2] === 3) {
        dim_in_use = '3D';
    }else {
        dim_in_use = 'multiD';
    }

    var suitableVis = [];
    var applicableVis = [];
    if (type_in_use === 'numerical' && dim_in_use === '1D') {
        suitableVis.push('rec-histogram');
        suitableVis.push('rec-density');
        applicableVis.push('rec-box');
        applicableVis.push('rec-violin');
        applicableVis.push('rec-scatter'); //use index
        applicableVis.push('rec-line'); //use index
    } else if (type_in_use === 'numerical' && dim_in_use === '2D') {
        suitableVis.push('rec-histogram');
        suitableVis.push('rec-density');
        suitableVis.push('rec-box');
        suitableVis.push('rec-violin');
        suitableVis.push('rec-scatter');
        suitableVis.push('rec-line');
    } else if (type_in_use === 'numerical' && dim_in_use === '3D') {
        suitableVis.push('rec-box');
        suitableVis.push('rec-violin');
        suitableVis.push('rec-bubble');
        suitableVis.push('rec-scatter3d'); 
        applicableVis.push('rec-scatter');
        applicableVis.push('rec-line');
        applicableVis.push('rec-histogram');
        applicableVis.push('rec-density');
    } else if (type_in_use === 'numerical' && dim_in_use === 'multiD') {
        //suitableVis.push('rec-ridge'); no icon no plotly
        suitableVis.push('rec-box');
        suitableVis.push('rec-violin');
        suitableVis.push('rec-heatmap');
        applicableVis.push('rec-scatter');
        applicableVis.push('rec-line');
        applicableVis.push('rec-histogram');
        applicableVis.push('rec-density');
        applicableVis.push('rec-scatter3d');
        applicableVis.push('rec-bubble');
    }

    if (type_in_use === 'categorical' && dim_in_use === '1D') {
        suitableVis.push('rec-bar');
        suitableVis.push('rec-pie');
        suitableVis.push('rec-donut');
        //suitableVis.push('rec-wordcloud');
        suitableVis.push('rec-treemap');
        applicableVis.push('rec-histogram');
        applicableVis.push('rec-density');
    } else if (type_in_use === 'categorical' && dim_in_use === '2D') {
        suitableVis.push('rec-parallel');
        suitableVis.push('rec-bar');
        applicableVis.push('rec-histogram');
        applicableVis.push('rec-density');
        applicableVis.push('rec-pie');
        applicableVis.push('rec-donut');
        //applicableVis.push('rec-wordcloud');
        applicableVis.push('rec-treemap');
    } else if (type_in_use === 'categorical' && dim_in_use === '3D') {
        suitableVis.push('rec-parallel');
        //suitableVis.push('rec-spider');
        suitableVis.push('rec-bar');
        applicableVis.push('rec-density');
        applicableVis.push('rec-pie');
        applicableVis.push('rec-donut');
        //applicableVis.push('rec-wordcloud');
        applicableVis.push('rec-treemap');
    } else if (type_in_use === 'categorical' && dim_in_use === 'multiD') {
        suitableVis.push('rec-parallel');
        //suitableVis.push('rec-spider');
        suitableVis.push('rec-bar');
        applicableVis.push('rec-density');
        applicableVis.push('rec-pie');
        applicableVis.push('rec-donut');
        //applicableVis.push('rec-wordcloud');
        applicableVis.push('rec-treemap');
    }
    //convert btn color first
    Array.from(document.getElementsByClassName('icon-btn')).forEach(element => {
        element.style.backgroundColor = '#dfecfb';
    });
    Array.from(document.getElementsByClassName('hint-btn')).forEach(element => {
        
        element.style.backgroundColor = '';
        
    });

    console.log('suitableVis:', suitableVis);
    console.log('applicableVis:', applicableVis);
    suitableVis.forEach(vis => {
        //document.getElementById(vis).style.display = 'block';
        //console.log('vis:', vis);
        document.getElementById(vis).style.backgroundColor = '#d1ffbd';
    });
    applicableVis.forEach(vis => {
        //console.log('vis:', vis);
        //document.getElementById(vis).style.display = 'block';
        document.getElementById(vis).style.backgroundColor = 'lightyellow';
    });
    

};
withdrawVisRec = function(){
    Array.from(document.getElementsByClassName('icon-btn')).forEach(element => {
        element.style.backgroundColor = '#dfecfb';
    });
};