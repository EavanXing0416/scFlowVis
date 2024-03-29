// Define the drawgraphNode
function drawgraphNode() {
    this.addInput("X", "string");
    this.addOutput("drawgraph_results", "string");
    this.properties = { filename: "", layout: 'fa',init_pos: false, random_state: 0}; 
    this.color = "#254030";

    // 添加控件
    this.addWidget("combo", "layout", this.properties.layout, (value) => {
        this.properties.layout = value;
        this.onWidgetValueChanged("layout", value);
    }, { values: ['fr', 'drl', 'kk', 'grid_fr', 'lgl', 'rt', 'rt_circular', 'fa'] });
    this.addWidget("toggle", "init_pos", this.properties.init_pos, (value) => {
        this.properties.init_pos = !!value; 
        this.onWidgetValueChanged("init_pos", value);
    });
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});

}

drawgraphNode.title = "dr-draw_graph";

drawgraphNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('drawgraphNode input data:', filename);
            if (filename) {
                this.runDrawGraph(filename);
            }
        }, 100);
    }
};

drawgraphNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('drawgraphNode input data:', filename);
            if (filename) {
                this.runDrawGraph(filename);
                console.log('drawgraphNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

drawgraphNode.prototype.runDrawGraph = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/drawgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            layout: this.properties.layout,
            init_pos: this.properties.init_pos,
            random_state: this.properties.random_state
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            throw new Error(data.error);
        } else {
            this.properties.filename = data.newFilename;
            this.setOutputData(0, data.newFilename);
            //this.trigger("onData", data.newFilename);
            this.color = "#254030";
            console.log('drawgraphNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

drawgraphNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/draw_graph", drawgraphNode);


