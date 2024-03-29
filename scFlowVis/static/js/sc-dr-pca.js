// Define the PCANode
function PCANode() {
    this.addInput("X", "string");
    this.addOutput("pca_results", "string");
    this.properties = { filename: "", n_components: 50, zero_center: true, svd_solver: 'auto' };
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_components", this.properties.n_components, (value) => {
        this.properties.n_components = Math.max(1, Math.round(value)); // 确保 n_components 是正整数
        this.onWidgetValueChanged("n_components", value);
    }, {step: 10, precision: 0, min: 1, max: 100});
    this.addWidget("toggle", "zero_center", this.properties.zero_center, (value) => {
        this.properties.zero_center = !!value; // 确保 zero_center 是布尔值
        this.onWidgetValueChanged("zero_center", value);
    });
    this.addWidget("combo", "svd_solver", this.properties.svd_solver, (value) => {
        this.properties.svd_solver = value;
        this.onWidgetValueChanged("svd_solver", value);
    }, { values: ["auto", "full", "arpack", "randomized"] });
}

PCANode.title = "dr-pca";

PCANode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('PCANode input data:', filename);
            if (filename) {
                this.runPCA(filename);
            }
        }, 100);
    }
};

PCANode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('PCANode input data:', filename);
            if (filename) {
                this.runPCA(filename);
                console.log('PCANode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

PCANode.prototype.runPCA = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";
    fetch('/tl/pca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_components: this.properties.n_components,
            zero_center: this.properties.zero_center,
            svd_solver: this.properties.svd_solver
        })
    })
    .then(response => response.json())
    //.then(response => {
    //    if (!response.ok) {
    //        throw new Error('Server returned error: ' + response.status);
    //    }
    //    return response.json();
    //})
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            throw new Error(data.error);
        } else {
            this.properties.filename = data.newFilename;
            this.setOutputData(0, data.newFilename);
            //this.trigger("onData", data.newFilename);
            this.color = "#254030";
            console.log('PCANode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

PCANode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/pca", PCANode);


// Define the PCAVisNode
function PCAVisNode() {
    this.addInput("pca_result", "string");
    this.properties = { color_by: ""};
    this.color = "#4D6772";

    this.addWidget("string", "color_by", this.properties.color_by, (value) => {
        this.properties.color_by = value;
        this.onWidgetValueChanged("color_by", value);
    });
}

PCAVisNode.title = "vis-pca";

PCAVisNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            var gene = this.properties.color_by;
            console.log('PCAVisNode input data:', filename);
            if (filename && filename.includes('pca_result')) {
                this.runPCAVis(filename,gene);
            }
        }, 100);
    }
};
PCAVisNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            var gene = this.properties.color_by;
            console.log('PCAVisNode input data:', filename);
            if (filename && filename.includes('pca_result')) {
                this.runPCAVis(filename,gene);
            }
        }, 100);
    }
};

PCAVisNode.prototype.runPCAVis = function(filename, gene) {
    fetch('/tl/vis/pca', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: filename,
            gene: gene
        }),
    })
    .then(response => response.json())
    .then(pca_data => {
        try {
            console.log('PCAVisNode data:', pca_data);
            // Create a line chart for the variance ratio
            var var_ratio = {
                x: Array.from({length: pca_data.variance_ratio.length}, (_, i) => i + 1),  // Principal components
                y: pca_data.variance_ratio,
                mode: 'lines',
                type: 'scatter',
                xaxis: 'x1',
                yaxis: 'y1'
            };

            // Create a scatter plot for the first two principal components
            var gene_expression = pca_data.gene_expression.length === 0 ? [0] : pca_data.gene_expression[0];
            var colorscale = gene_expression.length === 1 ? undefined : 'Viridis';
            var color = gene_expression.length === 1 ? 'darkgray' : gene_expression;

            var pca_scatter = {
                x: pca_data.X_pca.map(d => d[0]),  // First principal component
                y: pca_data.X_pca.map(d => d[1]),  // Second principal component
                mode: 'markers',
                type: 'scatter',
                xaxis: 'x2',
                yaxis: 'y2',
                marker: {
                    color: color, 
                    colorscale: colorscale, 
                    coloraxis: 'coloraxis',
                    line: {
                            color: 'black',  // Set the edge color to black
                            width: 0.5  // Set the edge width
                    },
                    opacity: 0.8  // Set the opacity to 70%},  // Use the modified color and colorscale
                },
                text: pca_data.cell_ids,  // Add cell IDs as hover text
                hoverinfo: 'text'  // Only show the hover text
            };
            var layout = {
                grid: {rows: 1, columns: 2, pattern: 'independent'},
                title: 'PCA Visualization',
                xaxis1: {title: 'PCs'},
                yaxis1: {title: 'Variance Ratio'},
                xaxis2: {title: 'PC1'},
                yaxis2: {title: 'PC2'},
                showlegend: false,
                coloraxis: {colorscale: 'Viridis', title: 'Gene Expression', colorbar: {thickness: 1}},
            };

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
            Plotly.newPlot(id, [var_ratio, pca_scatter], layout);

            // Activate the new tab
            $('#myTab a[href="#' + id + '"]').tab('show');
        } catch (error) {
            alert('Error: ' + pca_data.error);
            //alert('Error: ' + error);
            throw error;
        }
    });

};
// Register the node
LiteGraph.registerNodeType("scanpy/vis/pca", PCAVisNode);
