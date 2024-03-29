// Define the DiffmapNode
function DiffmapNode() {
    this.addInput("X", "string");
    this.addOutput("diffmap_results", "string");
    this.properties = { filename: "", n_comps: 15, neighbors_key: null, random_state: 0};
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_comps", this.properties.n_comps, (value) => {
        this.properties.n_comps = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_comps", value);
    }, {step: 10, precision: 0, min: 0, max: 100});
    this.addWidget("string", "neighbors_key", this.properties.neighbors_key, (value) => {
        this.properties.neighbors_key = value;
        this.onWidgetValueChanged("neighbors_key", value);
    });
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});
}

DiffmapNode.title = "ti-diffmap";

DiffmapNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('DiffmapNode input data:', filename);
            if (filename) {
                this.runDiffmap(filename);
            }
        }, 100);
    }
};

DiffmapNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('DiffmapNode input data:', filename);
            if (filename) {
                this.runDiffmap(filename);
                console.log('DiffmapNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

DiffmapNode.prototype.runDiffmap = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/diffmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_comps: this.properties.n_comps,
            neighbors_key: this.properties.neighbors_key,
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
            console.log('DiffmapNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

DiffmapNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/diffmap", DiffmapNode);


// Define the PagaNode
function PagaNode() {
    this.addInput("X", "string");
    this.addOutput("paga_results", "string");
    this.properties = { filename: "", groups: null, use_rna_velocity: false, neighbors_key: null};
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "groups", this.properties.groups, (value) => {
        this.properties.groups = value;
        this.onWidgetValueChanged("groups", value);
    });
    this.addWidget("toggle", "use_rna_velocity", this.properties.use_rna_velocity, (value) => {
        this.properties.use_rna_velocity = value;
        this.onWidgetValueChanged("use_rna_velocity", value);
    });
    this.addWidget("string", "neighbors_key", this.properties.neighbors_key, (value) => {
        this.properties.neighbors_key = value;
        this.onWidgetValueChanged("neighbors_key", value);
    });
}

PagaNode.title = "ti-paga";

PagaNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('PagaNode input data:', filename);
            if (filename) {
                this.runPaga(filename);
            }
        }, 100);
    }
};

PagaNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('PagaNode input data:', filename);
            if (filename) {
                this.runPaga(filename);
                console.log('PagaNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

PagaNode.prototype.runPaga = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/paga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            groups: this.properties.groups,
            use_rna_velocity: this.properties.use_rna_velocity,
            neighbors_key: this.properties.neighbors_key
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
            console.log('PagaNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

PagaNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/paga", PagaNode);

// Define the DptNode
function DptNode() {
    this.addInput("X", "string");
    this.addOutput("dpt_results", "string");
    this.properties = { filename: "", n_dcs: 10, n_branchings: 0, min_group_size: 0.01, allow_kendall_tau_shift: true, neighbors_key: null}; 
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_dcs", this.properties.n_dcs, (value) => {
        this.properties.n_dcs = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_dcs", value);
    }, {step: 10, precision: 0, min: 0, max: 50});
    this.addWidget("number", "n_branchings", this.properties.n_branchings, (value) => {
        this.properties.n_branchings = Math.max(0, Math.round(value)); 
        this.onWidgetValueChanged("n_branchings", value);
    }, {step: 10, precision: 0, min: 0, max: 50});
    this.addWidget("number", "min_group_size", this.properties.min_group_size, (value) => {
        this.properties.min_group_size = Math.max(0, Math.round(value)); 
        this.onWidgetValueChanged("min_group_size", value);
    }, {step: 0.1, precision: 2, min: 0, max: 50});
    this.addWidget("toggle", "allow_kendall_tau_shift", this.properties.allow_kendall_tau_shift, (value) => {
        this.properties.allow_kendall_tau_shift = value;
        this.onWidgetValueChanged("allow_kendall_tau_shift", value);
    });
    this.addWidget("string", "neighbors_key", this.properties.neighbors_key, (value) => {
        this.properties.neighbors_key = value;
        this.onWidgetValueChanged("neighbors_key", value);
    });
}

DptNode.title = "ti-dpt";

DptNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('DptNode input data:', filename);
            if (filename) {
                this.runDpt(filename);
            }
        }, 100);
    }
};

DptNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('DptNode input data:', filename);
            if (filename) {
                this.runDpt(filename);
                console.log('DptNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

DptNode.prototype.runDpt = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/dpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_dcs: this.properties.n_dcs,
            n_branchings: this.properties.n_branchings,
            min_group_size: this.properties.min_group_size,
            allow_kendall_tau_shift: this.properties.allow_kendall_tau_shift,
            neighbors_key: this.properties.neighbors_key
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
            console.log('DptNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

DptNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/dpt", DptNode);