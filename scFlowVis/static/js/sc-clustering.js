// Define the LeidenNode
function LeidenNode() {
    this.addInput("X", "string");
    this.addOutput("leiden_results", "string");
    this.properties = { filename: "", resolution: 1.00, random_state: 0, restrict_to: null, directed: true, use_weights: true, n_iterations: -1};
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "resolution", this.properties.resolution, (value) => {
        this.properties.resolution = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("resolution", value);
    }, {step: 0.1, precision: 2, min: 0, max: 10});
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});
    this.addWidget("number", "n_iterations", this.properties.n_iterations, (value) => {
        this.properties.n_iterations = Math.max(-1, Math.round(value));
        this.onWidgetValueChanged("n_iterations", value);
    }, {step: 10, precision: 0, min: -1});
    this.addWidget("string", "restrict_to", this.properties.restrict_to, (value) => {
        this.properties.restrict_to = value;
        this.onWidgetValueChanged("restrict_to", value);
    });
    this.addWidget("toggle", "directed", this.properties.directed, (value) => {
        this.properties.directed = value;
        this.onWidgetValueChanged("directed", value);
    });
    this.addWidget("toggle", "use_weights", this.properties.use_weights, (value) => {
        this.properties.use_weights = value;
        this.onWidgetValueChanged("use_weights", value);
    });
}

LeidenNode.title = "cl-leiden";

LeidenNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('LeidenNode input data:', filename);
            if (filename) {
                this.runLeiden(filename);
            }
        }, 100);
    }
};

LeidenNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('LeidenNode input data:', filename);
            if (filename) {
                this.runLeiden(filename);
                console.log('LeidenNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

LeidenNode.prototype.runLeiden = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/leiden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            resolution: this.properties.resolution,
            random_state: this.properties.random_state,
            restrict_to: this.properties.restrict_to,
            directed: this.properties.directed,
            use_weights: this.properties.use_weights,
            n_iterations: this.properties.n_iterations
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
            console.log('LeidenNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

LeidenNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/leiden", LeidenNode);


// Define the LouvainNode
function LouvainNode() {
    this.addInput("X", "string");
    this.addOutput("louvain_results", "string");
    this.properties = { filename: "", resolution: 1.00, random_state: 0, restrict_to: null, directed: true, use_weights: true, flavor: "vtraag"};
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "resolution", this.properties.resolution, (value) => {
        this.properties.resolution = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("resolution", value);
    }, {step: 0.1, precision: 2, min: 0, max: 10});
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});
    this.addWidget("string", "restrict_to", this.properties.restrict_to, (value) => {
        this.properties.restrict_to = value;
        this.onWidgetValueChanged("restrict_to", value);
    });
    this.addWidget("toggle", "directed", this.properties.directed, (value) => {
        this.properties.directed = value;
        this.onWidgetValueChanged("directed", value);
    });
    this.addWidget("toggle", "use_weights", this.properties.use_weights, (value) => {
        this.properties.use_weights = value;
        this.onWidgetValueChanged("use_weights", value);
    });
    this.addWidget("combo", "flavor", this.properties.flavor, (value) => {
        this.properties.flavor = value;
        this.onWidgetValueChanged("flavor", value);
    }, { values: ['vtraag', 'igraph', 'rapids'] });
}

LouvainNode.title = "cl-louvain";

LouvainNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('LouvainNode input data:', filename);
            if (filename) {
                this.runLouvain(filename);
            }
        }, 100);
    }
};

LouvainNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('LouvainNode input data:', filename);
            if (filename) {
                this.runLouvain(filename);
                console.log('LouvainNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

LouvainNode.prototype.runLouvain = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/louvain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            resolution: this.properties.resolution,
            random_state: this.properties.random_state,
            restrict_to: this.properties.restrict_to,
            directed: this.properties.directed,
            use_weights: this.properties.use_weights,
            flavor: this.properties.flavor
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
            console.log('LouvainNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

LouvainNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/louvain", LouvainNode);

// Define the DendrogramNode
function DendrogramNode() {
    this.addInput("X", "string");
    this.addOutput("dendrogram_results", "string");
    this.properties = { filename: "",group_by:"" , n_pcs: null, cor_method:'pearson', linkage_method:'complete', optimal_ordering:false}; //
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "group_by", this.properties.group_by, (value) => {
        this.properties.group_by = value;
        this.onWidgetValueChanged("group_by", value);
    });
    this.addWidget("number", "n_pcs", this.properties.n_components, (value) => {
        this.properties.n_components = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_pcs", value);
    }, {step: 10, precision: 0, min: 0, max: 100});
    this.addWidget("combo", "cor_method", this.properties.cor_method, (value) => {
        this.properties.cor_method = value;
        this.onWidgetValueChanged("cor_method", value);
    }, { values: ['pearson', 'kendall', 'spearman'] });
    this.addWidget("combo", "linkage_method", this.properties.linkage_method, (value) => {
        this.properties.linkage_method = value;
        this.onWidgetValueChanged("linkage_method", value);
    }, { values: ['complete', 'single', 'average', 'weighted', 'centroid'] });
    this.addWidget("toggle", "optimal_ordering", this.properties.optimal_ordering, (value) => {
        this.properties.optimal_ordering = value;
        this.onWidgetValueChanged("optimal_ordering", value);
    });

}

DendrogramNode.title = "cl-dendrogram";

DendrogramNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('DendrogramNode input data:', filename);
            if (filename) {
                this.runDendrogram(filename);
            }
        }, 100);
    }
};

DendrogramNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('DendrogramNode input data:', filename);
            if (filename) {
                this.runDendrogram(filename);
                console.log('DendrogramNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

DendrogramNode.prototype.runDendrogram = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/dendrogram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_pcs: this.properties.n_pcs,
            cor_method: this.properties.cor_method,
            linkage_method: this.properties.linkage_method,
            optimal_ordering: this.properties.optimal_ordering
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
            console.log('DendrogramNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

DendrogramNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/dendrogram", DendrogramNode);