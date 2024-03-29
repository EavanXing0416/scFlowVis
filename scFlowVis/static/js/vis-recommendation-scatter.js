// Define the ScatterVisNode
function vrScatterNode() {
    this.addInput("adata", "string");
    this.properties = {filename:"", x:"",y:"",z:"",size:"", color:"", label:"", chart:""};
    this.color = "#4D6772";
    /** 
    this.addWidget("text", "x", this.properties.x, (value) => {
        this.properties.x = value;
        this.onWidgetValueChanged("x", value);
    });
    this.addWidget("text", "y", this.properties.y, (value) => {
        this.properties.y = value;
        this.onWidgetValueChanged("y", value);
    });
    
    console.log('chart:', this.properties.chart);
    if(this.properties.chart === "scatter3d") {
        this.addWidget("text", "z", this.properties.z, (value) => {
            this.properties.z = value;
            this.onWidgetValueChanged("z", value);
        });
    }
    if (this.properties.chart === "bubble" || this.properties.chart == "scatter3d") {
        this.addWidget("text", "size", this.properties.size, (value) => {
            this.properties.size = value;
            this.onWidgetValueChanged("size", value);
        });
    }

    this.addWidget("text", "color", this.properties.color, (value) => {
        this.properties.color = value;
        this.onWidgetValueChanged("color", value);
    });
    this.addWidget("text", "label", this.properties.label, (value) => {
        this.properties.label = value;
        this.onWidgetValueChanged("label", value);
    });
    */
}

vrScatterNode.title = "vis-recommend";

vrScatterNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('vrScatterNode input data:', filename);

            var query_x = this.properties.x;
            var query_y = this.properties.y;
            
            var query_color = this.properties.color;
            var query_label = this.properties.label;
            
            if (this.properties.chart === "scatter") {
                this.runScatter(filename,'scatter', query_x, query_y, query_color, query_label);
            }
            if (this.properties.chart === "bubble") {
                var query_size = this.properties.size;
                this.runBubble(filename,'bubble', query_x, query_y, query_size, query_color, query_label);
            }
            if (this.properties.chart === "scatter3d") {
                var query_z = this.properties.z;
                var query_size = this.properties.size;
                this.runScatter3d(filename, 'scatter3d',query_x, query_y, query_z, query_size, query_color, query_label);
            }               
        }, 100);
    }
};
vrScatterNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called'); 
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('vrScatterNode input data:', filename);

            var query_x = this.properties.x;
            var query_y = this.properties.y;
            
            var query_color = this.properties.color;
            var query_label = this.properties.label;
            
            if (this.properties.chart === "scatter") {
                this.runScatter(filename,'scatter', query_x, query_y, query_color, query_label);
            }
            if (this.properties.chart === "bubble") {
                var query_size = this.properties.size;
                this.runBubble(filename,'bubble', query_x, query_y, query_size, query_color, query_label);
            }
            if (this.properties.chart === "scatter3d") {
                var query_z = this.properties.z;
                var query_size = this.properties.size;
                this.runScatter3d(filename, 'scatter3d',query_x, query_y, query_z, query_size, query_color, query_label);
            }                     
        }, 100);
        
    }
};



vrScatterNode.prototype.runScatter = function(filename, chart, x,y,color,label) {
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
    fetch('/vr/get_data_scatter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            chart: chart,
            x: x,
            y: y,
            color: color,
            label: label
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('vrScatterNode data:', data);
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
            
            var colortype = data.column_color_data_type
            var isCategorical = colortype === 'category';
            var discrete_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', 
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', 
            '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

            var discrete_colorscale = data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]);
            var colorscale = isCategorical ? discrete_colorscale : 'Viridis';
            console.log('colorscale used:', colorscale);
            console.log('colorscaletick:', [...new Set(data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]))]);
            console.log('colorscaleval:', [...new Set(data.column_color)]);

            var scatter = {
                x: data.column_x,  
                y: data.column_y,  
                mode: 'markers',
                type: 'scatter',
                xaxis: 'x',
                yaxis: 'y',
                marker: {
                    color: isCategorical ? colorscale : data.column_color,  // Use the modified color and colorscale
                    colorscale: isCategorical ? undefined : colorscale, 
                    coloraxis: isCategorical ? undefined : 'coloraxis',
                    line: {
                            color: 'black',  // Set the edge color to black
                            width: 0.5  // Set the edge width
                    },
                    opacity: 0.8,  // Set the opacity to 70%}, 
                },
                text: data.column_label,  // Add cell IDs as hover text
                hoverinfo: 'text'  // Only show the hover text
            };
            var layout = {
                xaxis1: {title: 'x'},
                yaxis1: {title: 'y'},
                showlegend: false,
            };
            
            var config = {responsive: true};
            // Create four tabs and tab contents
            async function createPlots(ids, scatter, layout, config) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, [scatter], layout, config);
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
    //console.log('vrScatterNode data:', data);

};


vrScatterNode.prototype.runBubble = function(filename, chart, x,y,size,color,label) {
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
    fetch('/vr/get_data_scatter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            chart: chart,
            x: x,
            y: y,
            size: size,
            color: color,
            label: label
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('vrScatterNode data:', data);
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
            
            var colortype = data.column_color_data_type
            var isCategorical = colortype === 'category';
            var discrete_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', 
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', 
            '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

            var discrete_colorscale = data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]);
            var colorscale = isCategorical ? discrete_colorscale : 'Viridis';
            console.log('colorscale used:', colorscale);
            console.log('colorscaletick:', [...new Set(data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]))]);
            console.log('colorscaleval:', [...new Set(data.column_color)]);

            var scatter = {
                x: data.column_x,  
                y: data.column_y,  
                mode: 'markers',
                type: 'scatter',
                xaxis: 'x',
                yaxis: 'y',
                marker: {
                    size: data.column_size,  // Set the size of the markers
                    sizemode: 'diameter',  // Set the size mode to diameter

                    color: isCategorical ? colorscale : data.column_color,  // Use the modified color and colorscale
                    colorscale: isCategorical ? undefined : colorscale, 
                    coloraxis: isCategorical ? undefined : 'coloraxis',
                    line: {
                            color: 'black',  // Set the edge color to black
                            width: 0.5  // Set the edge width
                    },
                    opacity: 0.8,  // Set the opacity to 70%}, 
                },
                text: data.column_label,  // Add cell IDs as hover text
                hoverinfo: 'text'  // Only show the hover text
            };
            var layout = {
                xaxis1: {title: 'x'},
                yaxis1: {title: 'y'},
                showlegend: false,
            };
            
            var config = {responsive: true};
            // Create four tabs and tab contents
            async function createPlots(ids, scatter, layout, config) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, [scatter], layout,config);
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
    //console.log('vrScatterNode data:', data);

};


vrScatterNode.prototype.runScatter3d = function(filename, chart, x,y,z,size,color,label) {
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
    fetch('/vr/get_data_scatter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            chart: chart,
            x: x,
            y: y,
            z: z,
            size: size,
            color: color,
            label: label
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('vrScatterNode data:', data);
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
            
            var colortype = data.column_color_data_type
            var isCategorical = colortype === 'category';
            var discrete_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', 
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', 
            '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

            var discrete_colorscale = data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]);
            var colorscale = isCategorical ? discrete_colorscale : 'Viridis';
            console.log('colorscale used:', colorscale);
            console.log('colorscaletick:', [...new Set(data.column_color.map(d => discrete_colors[Math.abs(hashCode(d)) % discrete_colors.length]))]);
            console.log('colorscaleval:', [...new Set(data.column_color)]);
            
            var isSize = data.column_size.length > 0;

            var scatter = {
                x: data.column_x,  
                y: data.column_y,
                z: data.column_z,  
                mode: 'markers',
                type: 'scatter3d',
                xaxis: 'x',
                yaxis: 'y',
                marker: {
                    size: isSize ? data.column_size : 5,  // Set the size of the markers
                    color: isCategorical ? colorscale : data.column_color,  // Use the modified color and colorscale
                    colorscale: isCategorical ? undefined : colorscale, 
                    coloraxis: isCategorical ? undefined : 'coloraxis',
                    line: {
                            color: 'black',  // Set the edge color to black
                            width: 0.5  // Set the edge width
                    },
                    opacity: 0.8,  // Set the opacity to 70%}, 
                },
                text: data.column_label,  // Add cell IDs as hover text
                hoverinfo: 'text'  // Only show the hover text
            };
            var layout = {
                xaxis1: {title: 'x'},
                yaxis1: {title: 'y'},
                showlegend: false,
            };
            
            var config = {responsive: true};
            // Create four tabs and tab contents
            async function createPlots(ids, scatter, layout) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, [scatter], layout, config);
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
    //console.log('vrScatterNode data:', data);

};

// Register the node
LiteGraph.registerNodeType("scanpy/vis/vr-scatter", vrScatterNode);
