// Define the ScatterVisNode
function ScatterNode() {
    this.addInput("adata", "string");
    this.properties = {filename:"", data:"", color:""};
    this.color = "#4D6772";

     // Initialize the options with empty arrays
     this.dataOptions = [];
     this.colorOptions = [];

    this.addWidget("combo", "data", this.properties.data, (value) => {
        this.properties.data = value;
        this.onWidgetValueChanged("data", value);
    }, { values: this.dataOptions });
    this.addWidget("combo", "color", this.properties.color, (value) => {
        this.properties.color = value;
        this.onWidgetValueChanged("color", value);
    }, { values: this.colorOptions });
}

ScatterNode.title = "vis-scatter";

ScatterNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('ScatterNode input data:', filename);
            if (filename) {
                fetch('/vr/get_scatter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        filename: filename
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('ScatterNode data:', data);
                    // Update the options
                    this.dataOptions = data.available_data;
                    this.colorOptions = data.available_color;

                    // Update the widgets
                    this.widgets[0].options = { values: this.dataOptions };
                    this.widgets[1].options = { values: this.colorOptions };
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        }, 100);
    }
};
ScatterNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called'); 
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            var selected_data = this.properties.data;
            var selected_color = this.properties.color
            console.log('ScatterNode input data:', filename);
            console.log('ScatterNode selected data & color:', [selected_data, selected_color]);            
                if (filename && selected_data && selected_color) { 
                    this.runScatter(filename, selected_data, selected_color);
                    /**
                    fetch('/vr/scatter', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: filename,
                            data: selected_data,
                            color: selected_color
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('ScatterNode data:', data);
                        // Use the returned data to draw the scatterplot
                        this.runScatter(data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                    **/
                }          
        }, 100);
        
    }
};



ScatterNode.prototype.runScatter = function(filename, selected_data, selected_color) {
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
    fetch('/vr/scatter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            data: selected_data,
            color: selected_color
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('ScatterNode data:', data);
        // Use the returned data to draw the scatterplot
        //this.runScatter(data);
        if (data.error) {
            // Show the error message
            loadingDiv.innerHTML = 'Error: ' + data.error;
        } else {
            // Clear the loading message
            loadingDiv.innerHTML = '';

            //preparre the data for drawing scatter plot
            // Create a scatter plot for the first two principal components    
            function hashCode(str) {
                var hash = 0;
                for (var i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash |= 0; // Convert to 32bit integer
                }
                return hash;
            }//this is a function to generate a hash code for the color
            
            var colortype = data.color_data_type
            var isCategorical = colortype === 'category';
            var discrete_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', 
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', 
            '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

            //var discrete_colorscale = data.color_returned.map(d => discrete_colors[d % discrete_colors.length]);
            var discrete_colorscale = data.color_returned.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]);
            var colorscale = isCategorical ? discrete_colorscale : 'Viridis';
            console.log('colorscale used:', colorscale);
            console.log('colorscaletick:', [...new Set(data.color_returned.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]))]);
            console.log('colorscaleval:', [...new Set(data.color_returned)]);

            var scatter = {
                x: data.data_retured.map(d => d[0]),  // First component
                y: data.data_retured.map(d => d[1]),  // Second component
                mode: 'markers',
                type: 'scatter',
                xaxis: 'x1',
                yaxis: 'y1',
                marker: {
                    color: isCategorical ? colorscale : data.color_returned,  // Use the modified color and colorscale
                    colorscale: isCategorical ? undefined : colorscale, 
                    coloraxis: isCategorical ? undefined : 'coloraxis',
                    line: {
                            color: 'black',  // Set the edge color to black
                            width: 0.5  // Set the edge width
                    },
                    opacity: 0.8,  // Set the opacity to 70%}, 
                    //colorbar: {
                        //tickvals: isCategorical ? [...new Set(data.color_returned.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]))] : undefined,
                        //ticktext: isCategorical ? [...new Set(data.color_returned)] : undefined
                    //}
                },
                text: data.cell_ids,  // Add cell IDs as hover text
                hoverinfo: 'text'  // Only show the hover text
            };
            var layout = {
                xaxis1: {title: 'component 1'},
                yaxis1: {title: 'component 2'},
                showlegend: false,
                coloraxis: {colorscale: colorscale, colorbar: {thickness: 1}},
            };

            var config = {responsive: true};
            

            // Create four tabs and tab contents
            async function createPlots(ids, scatter, layout, config) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, [scatter], layout, config);

                    // Add plotly_selected event listener to the plot
                    document.getElementById(id).on('plotly_selected', function(eventData) {
                        if(eventData) {
                            // Get the text of the selected points
                            var selectedTexts = eventData.points.map(function(point) {
                                return point.text;
                            });

                            // Display the ids in the textarea
                            document.getElementById('cell-id-notes').value = selectedTexts.join(', ');
                        }
                    });
                    
                    $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');
                }
            }

            // Then call this function with your parameters
            createPlots(ids, scatter, layout, config).then(() => console.log('All plots created'));
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
    //console.log('ScatterNode data:', data);


/**old version 
    // Plot the data
    // Generate a unique ID for the new tab and div
    var id = 'tab' + Date.now();

    // Create a new tab
    var newTab = document.createElement('li');
    newTab.className = 'nav-item';
    newTab.innerHTML = `
        <a class="nav-link" id="${id}-tab" data-toggle="tab" href="#${id}" role="tab" aria-controls="${id}" aria-selected="false">
            Tab ${id}
            <button type="button" class="close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </a>`;
    document.getElementById('myTab').appendChild(newTab);

    // Add event listener to the close button
    newTab.querySelector('.close').addEventListener('click', function(event) {
        event.stopPropagation();
        event.preventDefault();

        // Remove the tab and its content
        document.getElementById(id).remove();
        newTab.remove();
    });

    // Create a new div for the visualization
    var newDiv = document.createElement('div');
    newDiv.className = 'tab-pane fade';
    newDiv.id = id;
    document.getElementById('myTabContent').appendChild(newDiv);

    // Now you can create the visualization in the new div
    //Plotly.newPlot('mydiv', [var_ratio, pca_scatter], layout);
    Plotly.newPlot(id, [scatter], layout);

    // Activate the new tab
    $('#myTab a[href="#' + id + '"]').tab('show');
*/
};
// Register the node
LiteGraph.registerNodeType("scanpy/vis/scatter", ScatterNode);
