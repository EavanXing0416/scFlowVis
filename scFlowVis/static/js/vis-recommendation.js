// Define the VisRecommendNode
function VisRecommendNode() {    
    this.addInput("adata", "string");
    this.properties = {filename:"", chart:"", datatovis:"",adataAttribute:"",subKey:""};
    this.color = "#4D6772";

     // Initialize the options with empty arrays
     this.adataAttribute = [];
     this.subAttributekey = [];

    this.addWidget("combo", "adataAttribute", this.properties.adataAttribute, (value) => {
        this.properties.adataAttribute = value;
        this.onWidgetValueChanged("adataAttribute", value);
    }, { values: this.adataAttribute });
    /**
    this.addWidget("combo", "subAttributeKey", this.properties.subAttributekey, (value) => {
        this.properties.subAttributekey = value;
        this.onWidgetValueChanged("subAttributeKey", value);
    }, { values: this.subAttributekey });
     */
}

VisRecommendNode.title = "vis-recommend";

VisRecommendNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('VisRecommendNode input data:', filename);
            if (filename) {
                fetch('/vr/get_data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: filename,
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('VisRecommendNode data:', data);
                    // Update the options
                    adata_obj_list = data.adata_obj_list;
                    this.adataAttribute = Object.keys(adata_obj_list);

                    // Update the widgets
                    this.widgets[0].options = { values: this.adataAttribute };
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        }, 100);
    }
};
VisRecommendNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called'); 
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            var selected_attribute = this.properties.adataAttribute;
            if (filename && selected_attribute && name === 'adataAttribute') {
                if (this.widgets.length > 1) {
                    this.widgets.splice(1, 1); // Remove the second widget
                }
                fetch('/vr/get_data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: filename,
                    })
                })
                .then(response => response.json())
                .then(data => {
                    //console.log('VisRecommendNode data:', data);
                    // Update the options
                    this.subAttributekey = data.adata_obj_list[selected_attribute];
                    //console.log('VisRecommendNode subAttributekey:', this.subAttributekey);
                    this.properties.subKey = this.subAttributekey;
                    this.addWidget("combo", "subKey", this.subAttributekey[0], (value) => {
                        console.log(value);
                        this.properties.subKey = value;
                        this.onWidgetValueChanged("subAttributeKey", value);
                    }, { values: this.subAttributekey });
                })
                .catch(error => {
                    console.error('Error:', error);
                });
                
            }else if (filename && selected_attribute && name === 'subAttributeKey') {
                var selected_attribute = this.properties.adataAttribute;
                var selected_subattribute = this.properties.subKey;
                var selected_chart = this.properties.chart;
                //console.log('VisRecommendNode selected_attribute:', selected_attribute);
                //console.log('VisRecommendNode selected_subattribute:', selected_subattribute);
                this.runVisRecommend(filename, selected_attribute, selected_subattribute, selected_chart);
            }
        }, 100);
        
    }
};



VisRecommendNode.prototype.runVisRecommend = function(filename, selected_attribute, selected_subattribute,selected_chart) {
    // Create four tabs and tab contents
    var ids = [];
    for (var i = 1; i <= 4; i++) {
        var id = 'tab' + i + Date.now();
        ids.push(id);
        // Create a new tab
        var newTab = document.createElement('li');
        newTab.className = 'nav-item';
        newTab.id = id + '-tab';
        newTab.innerHTML = `
            <a class="nav-link" id="${id}-tab-link" data-toggle="tab" href="#${id}" role="tab" aria-controls="${id}" aria-selected="false">
                <button type="button" class="close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${this.title}
            </a>`;
        document.getElementById('myTab'+i).appendChild(newTab);

        // Create a new div for the visualization
        var newDiv = document.createElement('div');
        newDiv.className = 'tab-pane fade';
        newDiv.id = id;
        //console.log(newDiv.id);
        document.getElementById('myTabContent'+i).appendChild(newDiv);
    }

    // Create the visualization in the new div  
    // Show the loading message
    var loadingDiv = document.getElementById('loading-message');
    loadingDiv.innerHTML = 'Loading...';

    //
    fetch('/vr/vis_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            attribute: selected_attribute,
            subattribute: selected_subattribute,
            chart: selected_chart
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('VisRecommendNode data:', data);
        // Use the returned data to draw the vis-recommendplot
        //this.runVisRecommend(data);
        if (data.error) {
            // Show the error message
            loadingDiv.innerHTML = 'Error: ' + data.error;
        } else {
            // Clear the loading message
            loadingDiv.innerHTML = '';

            //prepare the data for drawing vis-recommend plot
            // Create a vis-recommend plot    
            var title = 'adata.'+selected_attribute + '[' + selected_subattribute + ']';                     
            var returned_data = data.data_returned;
            console.log('returned_data:', returned_data);
            
            function transpose(array) {
                return array[0].map((_, i) => array.map(row => row[i]));
            }
            
            if (typeof returned_data === 'object' && returned_data !== null) {
                var data_keys = Object.keys(returned_data);
                var data_keys_flat = data_keys.flat();
                var data_values = Object.values(returned_data);
                var data_values_flat = data_values.flat();
                if (Array.isArray(data_values[0])) {
                    returned_data = transpose(data_values);
                } 
                else {
                    returned_data = data_values_flat;
                }
            }
            console.log('returned_data:', returned_data);
            
            if (selected_chart === 'bar') {
                var {plotly_data, plotly_layout} = this.plotlyBar(returned_data,title);
            }
            else if (selected_chart === 'line') {
                var {plotly_data, plotly_layout} = this.plotlyLine(returned_data,title);
            } 
            else if (selected_chart === 'pie') {
                var {plotly_data, plotly_layout} = this.plotlyPie(returned_data,title);
            }
            else if (selected_chart === 'donut') {
                var {plotly_data, plotly_layout} = this.plotlyDonut(returned_data,title);
            }
            else if (selected_chart === 'box') {
                var {plotly_data, plotly_layout} = this.plotlyBox(returned_data,title);
            }
            else if (selected_chart === 'violin') {
                var {plotly_data, plotly_layout} = this.plotlyViolin(returned_data,title);
            }
            else if (selected_chart === 'histogram') {
                var {plotly_data, plotly_layout} = this.plotlyHistogram(returned_data,title);
            }
            else if (selected_chart === 'density') {
                var {plotly_data, plotly_layout} = this.plotlyDensity(returned_data,title);
            }
            else if (selected_chart === 'heatmap') {
                var {plotly_data, plotly_layout} = this.plotlyHeatmap(returned_data,title);
            }
            else if (selected_chart === 'parallel') {
                if (data_keys && data_values && data_values[0].length > 1){
                    var {plotly_data, plotly_layout} = this.plotlyParallel(data_values,data_keys,title);
                }else if (Array.isArray(data) && Array.isArray(data[0])){
                    var {plotly_data, plotly_layout} = this.plotlyLine(data_values,null,title);
                }
            }

            console.log('plotly_data:', plotly_data);
            console.log('plotly_layout:', plotly_layout);
            // Create four tabs and tab contents
            async function createPlots(ids, plotly_data, plotly_layout, plotly_conifg) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, plotly_data, plotly_layout, plotly_conifg);
                    $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');
                }
            }

            // Then call this function with your parameters
            plotly_conifg = {responsive: true};
            createPlots(ids, plotly_data, plotly_layout, plotly_conifg).then(() => console.log('All plots created'));
        }
    })
    .catch(error => {
        // Show the error message
        loadingDiv.innerHTML = 'Error: ' + error.message;
    });

    // Add event listener to the close button
    document.querySelectorAll('.close').forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            event.preventDefault();

            // Remove the tab and its content
            var id = this.parentElement.id.replace('-tab-link', '');
            document.getElementById(id).remove();
            document.getElementById(id + '-tab').remove();
        });
    });
    //console.log('VisRecommendNode data:', data);

};
// Register the node
LiteGraph.registerNodeType("scanpy/vis/recommend", VisRecommendNode);

/////////////different plotly visulziations/////////////////////    
//1) Bar chart
VisRecommendNode.prototype.plotlyBar = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    //aggregate by category and calculate the count of each category
    var counts = data.reduce(function (acc, curr) {
        if (typeof acc[curr] == 'undefined') {
            acc[curr] = 1;
        } else {
            acc[curr] += 1;
        }
        return acc;
    }, {});

    var categories = Object.keys(counts);
    var values = Object.values(counts);
    console.log('categories:', categories);
    console.log('values:', values);
    var bar_data = [{
        x: categories,
        y: values,
        type: 'bar'
    }];

    var layout = {
        title: 'Bar Chart of '+title,
        xaxis: {title: 'Categories'},
        yaxis: {title: 'Count'},
        autosize: true,
    };

    return {plotly_data:bar_data, plotly_layout:layout};
};

//2) Line chart
VisRecommendNode.prototype.plotlyLine = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    //console.log('data:', data);
    var line_data;
    if (Array.isArray(data[0])) {
        // Multi-dimensional data
        //[[row1], [row2], ...] => [[col1], [col2], ...]
        // transpose the matrix first
        //console.log('Before transpose:', data);
        //data = data[0].map((_, i) => data.map(row => row[i]));
        //console.log('After transpose:', data);
        // If there are more than 20 lines, only take the first 20
        var slicedData = data.length > 20 ? data.slice(0, 20) : data;
        console.log('slicedData:', slicedData);

        line_data = slicedData.map(function(subData, index) {
            return {
                x: Array.from({length: data[0].length},  (_, i) => i + 1),
                y: subData,
                type: 'scatter', // Use 'scatter' for line charts
                mode: 'lines',
                name: '#' + (index + 1) // Give each line a name
            };
        });
    } else {
        // 1-dimensional data
        line_data = [{
            x: Array.from({length: data.length},  (_, i) => i + 1),
            y: data,
            type: 'scatter',
            mode: 'lines',
            name: '#1'
        }];
    }

    var layout = {
        title: 'Line Chart of '+title,
        xaxis: {title: 'Index'},
        yaxis: {title: 'Value'},
        autosize: true,
    };

    return {plotly_data:line_data, plotly_layout:layout};
}

// 3) donut and pie chart
VisRecommendNode.prototype.plotlyPie = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    //aggregate by category and calculate the count of each category
    var counts = data.reduce(function (acc, curr) {
        if (typeof acc[curr] == 'undefined') {
            acc[curr] = 1;
        } else {
            acc[curr] += 1;
        }
        return acc;
    }, {});

    var categories = Object.keys(counts);
    var values = Object.values(counts);
    console.log('categories:', categories);
    console.log('values:', values);
    var pie_data = [{
        labels: categories,
        values: values,
        type: 'pie'
    }];

    var layout = {
        title: 'Pie Chart of '+title,
        autosize: true,
    };

    return {plotly_data:pie_data, plotly_layout:layout};
};

VisRecommendNode.prototype.plotlyDonut = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    //aggregate by category and calculate the count of each category
    var counts = data.reduce(function (acc, curr) {
        if (typeof acc[curr] == 'undefined') {
            acc[curr] = 1;
        } else {
            acc[curr] += 1;
        }
        return acc;
    }, {});

    var categories = Object.keys(counts);
    var values = Object.values(counts);
    console.log('categories:', categories);
    console.log('values:', values);
    var donut_data = [{
        labels: categories,
        values: values,
        hole: 0.5,
        type: 'pie'
    }];

    var layout = {
        title: 'Donut Chart of '+title,
        autosize: true,
    };

    return {plotly_data:donut_data, plotly_layout:layout};
};

// 4)box and violin plot
VisRecommendNode.prototype.plotlyBox = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]

    if (Array.isArray(data[0])) {
        // Multi-dimensional data
        //[[row1], [row2], ...] => [[col1], [col2], ...] // transpose the matrix first
        //console.log('Before transpose:', data);
        //data = data[0].map((_, i) => data.map(row => row[i]));
        //console.log('After transpose:', data);
        // If there are more than 20 lines, only take the first 20
        var slicedData = data.length > 20 ? data.slice(0, 20) : data;
        console.log('slicedData:', slicedData);

        box_data = slicedData.map(function(subData, index) {
            return {
                y: subData,
                type: 'box', 
                name: '#' + (index + 1)
            };
        });
    } else {
        // 1-dimensional data
        box_data = [{
            y: data,
            type: 'box',
            //name: '#1'
        }];
    }

    var layout = {
        title: 'Box Chart of '+title,
        //xaxis: {title: 'Index'},
        //yaxis: {title: 'Value'},
        autosize: true,
    };

    return {plotly_data:box_data, plotly_layout:layout};
};

VisRecommendNode.prototype.plotlyViolin = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]

    if (Array.isArray(data[0])) {
        // Multi-dimensional data
        //[[row1], [row2], ...] => [[col1], [col2], ...] // transpose the matrix first
        //console.log('Before transpose:', data);
        //data = data[0].map((_, i) => data.map(row => row[i]));
        //console.log('After transpose:', data);
        // If there are more than 20 lines, only take the first 20
        var slicedData = data.length > 20 ? data.slice(0, 20) : data;
        console.log('slicedData:', slicedData);

        violin_data = slicedData.map(function(subData, index) {
            return {
                y: subData,
                type: 'violin', 
                name: '#' + (index + 1)
            };
        });
    } else {
        // 1-dimensional data
        violin_data = [{
            y: data,
            type: 'violin',
            box:{visible: true},
            boxpoints: 'false',
            line: {color: 'black'},
            fillcolor: '#8dd3c7',
            opacity: 0.6,
            meanline:{visible: true},
            //name: '#1'
        }];
    }

    var layout = {
        title: 'Violin Chart of '+title,
        //xaxis: {title: 'Index'},
        //yaxis: {title: 'Value'},
        autosize: true,
    };

    return {plotly_data:violin_data, plotly_layout:layout};
};

// 5) histogram and density
VisRecommendNode.prototype.plotlyHistogram = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]

    var histogram_data = [{
        x: data,
        type: 'histogram',
        marker: {
            color: 'rgba(100,149,237,0.6)',
            line: {
                color: 'rgba(100,149,237,1)',
                width: 1
            }
        }
    }];

    var layout = {
        title: 'Histogram of '+title,
        xaxis: {title: 'Value'},
        yaxis: {title: 'Count'},
        autosize: true,
    };

    return {plotly_data:histogram_data, plotly_layout:layout};
};

VisRecommendNode.prototype.plotlyDensity = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]

    var density_data = [{
        x: data,
        type: 'histogram',
        histnorm: 'probability density', // this line makes it a density plot
        autobinx: false,
        xbins: {
            start: Math.min(...data),
            end: Math.max(...data),
            size: 0.5,
        },
        opacity: 0.75,
        name: 'Histogram'
    }];

    var layout = {
        title: 'Density plot of '+title,
        xaxis: {title: 'Value'},
        yaxis: {title: 'Density'},
        autosize: true,
    };

    return {plotly_data:density_data, plotly_layout:layout};
};

// 6) heatmap

VisRecommendNode.prototype.plotlyHeatmap = function(data,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    console.log('data:', data);
    // Calculate frequency for each pair of variables
     // Calculate sum for each row and column
     var rowSums = data.map(row => row.reduce((a, b) => a + b, 0));
     var colSums = data[0].map((col, i) => data.reduce((a, b) => a + b[i], 0));
    //console.log('rowSums:', rowSums);
    //console.log('colSums:', colSums);
     // Create arrays of indices sorted by row and column sums
     var sortedRowIndices = rowSums.map((val, i) => i).sort((a, b) => rowSums[b] - rowSums[a]);
     var sortedColIndices = colSums.map((val, i) => i).sort((a, b) => colSums[b] - colSums[a]);
    console.log('sortedRowIndices:', sortedRowIndices);
    console.log('sortedColIndices:', sortedColIndices);
     // Sort data according to the sorted indices
     var sortedDataByRow = sortedRowIndices.map(i => data[i]);
     var sortedDataByCol = data.map(row => sortedColIndices.map(i => row[i]));
    console.log('sortedDataByRow:', sortedDataByRow);
    console.log('sortedDataByCol:', sortedDataByCol);
     var heatmapData = [{
         //x: xValues,
         //y: yValues,
         z: data,
         type: 'heatmap',
     }];

     var originalColIndices = Array.from({length: data[0].length}, (_, i) => i) 
     var originalRowIndices = Array.from({length: data.length}, (_, i) => i)
    console.log('originalRowIndices:', originalRowIndices);
    console.log('originalColIndices:', originalColIndices); 
     var layout = {
         title: 'Heatmap of ' + title,
         autosize: true,

         updatemenus: [{
            x: 0.1,
            y: 0.8,
            buttons: [{
                args: [{'z': [data], 'x': [originalColIndices], 'y': [originalRowIndices]}],
                label: 'Original Order',
                method: 'restyle'
            }, {
                args: [{'z': [sortedDataByCol], 'x': [sortedColIndices], 'y': [originalRowIndices]}],
                label: 'Order by Column Sum',
                method: 'restyle'
            }, {
                args: [{'z': [sortedDataByRow], 'x': [originalColIndices],'y': [sortedRowIndices]}],
                label: 'Order by Row Sum',
                method: 'restyle'
            }]
        }]
     };
 
     return {plotly_data: heatmapData, plotly_layout: layout}; 
    //Old simple version
    /**
    var heatmap_data = [{
        z: data,
        type: 'heatmap'
    }];

    var layout = {
        title: 'Heatmap of '+title,
        xaxis: {title: 'observation'},
        yaxis: {title: 'variable'},
        autosize: true,
    };

    return {plotly_data:heatmap_data, plotly_layout:layout};
     */
    }

// 7) parallel coordinates
VisRecommendNode.prototype.plotlyParallel = function(data,key,title) {//data input shold be the jsonfied adata.attribute[subattributekey]
    // Prepare the dimensions array
    var dimensions
    if (key) {dimensions = key.map((arr, i) => {
        return {
            label: arr,
            values: data[i]
            };
        });
    } else {dimensions = data.map((arr, i) => {
        return {
            label:  `Dimension ${i+1}`,
            values: arr
            };
        });
    }
    console.log('dimensions:', dimensions); 

    var parallel_data = [{
        type: 'parcoords',
        line: {
            color: 'blue'
        },
        dimensions: dimensions
    }];

    var layout = {
        title: 'Parallel Coordinates Chart of ' + title,
        autosize: true,
    };

    return {plotly_data: parallel_data, plotly_layout: layout};
}
