// Define the scPlotNode
function scPlotNode() {
    this.addInput("adata", "string");
    this.properties = {filename:"", plot_method:"", parameters:""};
    this.color = "#4D6772";

    this.addWidget("string", "plot_method", this.properties.plot_method, (value) => {
        this.properties.plot_method = value;
        this.onWidgetValueChanged("plot_method", value);
    });
    this.addWidget("text", "parameters", this.properties.parameters, (value) => {
        if (value === "") {
            value = null;
        }
        this.properties.parameters = value;
        this.onWidgetValueChanged("parameters", value);
    });
}

//scPlotNode.title = "vis-sc_plot";

scPlotNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('scPlotNode input data:', filename);
            console.log('scPlotNode properties vis-method: ', this.properties.plot_method);
        }, 100);
    }
};
scPlotNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called'); 
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            var vis_method = this.properties.plot_method;
            var parameters = this.properties.parameters;
            console.log('scPlotNode input data:', filename);
            console.log('scPlotNode properties vis-method: ', vis_method);
            console.log('scPlotNode properties parameters: ', parameters);

                if (filename && vis_method) { 
                    this.runscPlot(filename, vis_method, parameters);
                    /*
                    fetch('/sc/pl/' + vis_method, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: filename,
                            vis_function_name: vis_method,
                            para: parameters
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        this.runscPlot;
                        if (data.error) {
                            // Show the error message
                            newDiv.innerHTML = 'Error: ' + data.error;
                        } else {
                            // Clear the loading message
                            newDiv.innerHTML = '';
                            
                            ids.forEach((id,index) => {
                                console.log(id);
                                var tab_no = index+1;
                                mpld3.draw_figure(id, data).then(() => console.log('Plotted'));
                                $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error:', error);
                    });
                */    
                }          
        }, 100);
        
    }
};



scPlotNode.prototype.runscPlot = function(filename, vis_method, parameters) {
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
    fetch('/sc/pl/' + vis_method, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            vis_function_name: vis_method,
            para: parameters
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if (data.error) {
            // Show the error message
            loadingDiv.innerHTML = 'Error: ' + data.error;
        } else {
            // Clear the loading message
            loadingDiv.innerHTML = '';
            
            ids.forEach((id,index) => {
                console.log(id);
                var tab_no = index+1;
                mpld3.draw_figure(id, data);
                $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');                
            });
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

    //Responsive Layout
    /**
    setTimeout(() => {
        ids.forEach((id,index) => {
            let svgElement = document.querySelector('#' + id + ' div svg');
            if (svgElement) {
                // SVG element exists, do something...
                let width = svgElement.clientWidth;
                let height = svgElement.clientHeight;
                svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
                svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                //svgElement.style.overflow = 'visible'; 
            } else {
                // SVG element does not exist
                console.log('No SVG element found for id:', id);
            }             
        });
    }, 1000);
     */
    // Draw the D3 figure
    //mpld3.draw_figure('randomlayout', data);
};
// Register the node
LiteGraph.registerNodeType("scanpy/vis-methods", scPlotNode);
