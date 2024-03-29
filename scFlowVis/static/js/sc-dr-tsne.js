// Define the TSNENode
function TSNENode() {
    this.addInput("X", "string");
    this.addOutput("tsne_results", "string");
    this.properties = { filename: "", n_pcs: null, perplexity: 30, learning_rate: 1000, random_state: 0}; //
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_pcs", this.properties.n_components, (value) => {
        this.properties.n_components = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_pcs", value);
    }, {step: 10, precision: 0, min: 0, max: 100});
    this.addWidget("number", "perplexity", this.properties.perplexity, (value) => {
        this.properties.perplexity = Math.max(1, Math.round(value));
        this.onWidgetValueChanged("perplexity", value);
    }, {step: 10, precision: 0, min: 5, max: 50});
    this.addWidget("number", "learning_rate", this.properties.learning_rate, (value) => {
        this.properties.learning_rate = Math.max(1, Math.round(value));
        this.onWidgetValueChanged("learning_rate", value);
    }, {step: 10, precision: 0, min: 100, max: 1000});
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0, max: 100});

}

TSNENode.title = "dr-tsne";

TSNENode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('TSNENode input data:', filename);
            if (filename) {
                this.runTSNE(filename);
            }
        }, 100);
    }
};

TSNENode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('TSNENode input data:', filename);
            if (filename) {
                this.runTSNE(filename);
                console.log('TSNENode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

TSNENode.prototype.runTSNE = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/tsne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_pcs: this.properties.n_pcs,
            perplexity: this.properties.perplexity,
            learning_rate: this.properties.learning_rate,
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
            this.color = "#254030";
            console.log('TSNENode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

TSNENode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/t-sne", TSNENode);



