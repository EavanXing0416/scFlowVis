// Define the PCANode
function UMAPNode() {
    this.addInput("X", "string");
    this.addOutput("umap_results", "string");
    this.properties = { filename: "", n_components: 2, init_pos: 'spectral', random_state: 0};
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_components", this.properties.n_components, (value) => {
        this.properties.n_components = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_components", value);
    }, {step: 10, precision: 0, min: 1, max: 50});
    this.addWidget("combo", "init_pos", this.properties.init_pos, (value) => {
        this.properties.init_pos = value;
        this.onWidgetValueChanged("init_pos", value);
    }, { values: ["paga", "spectral", "random"] });
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});

}

UMAPNode.title = "dr-umap";

UMAPNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('UMAPNode input data:', filename);
            if (filename) {
                this.runUMAP(filename);
            }
        }, 100);
    }
};

UMAPNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('UMAPNode input data:', filename);
            if (filename) {
                this.runUMAP(filename);
                console.log('UMAPNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

UMAPNode.prototype.runUMAP = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/umap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_components: this.properties.n_components,
            init_pos: this.properties.init_pos,
            random_state: this.properties.random_state
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
            this.color = "#254030";
            console.log('UMAPNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
    //.finally(() => {
    //    this.setDirtyCanvas(true, true);
    //});
};

UMAPNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/umap", UMAPNode);



