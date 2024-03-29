// Define the SGNode
function SGNode() {
    this.addInput("X", "string");
    this.addOutput("score-genes_results", "string");
    this.properties = { filename: "", gene_list: "", ctrl_size: 50, gene_pool: "", n_bins: 25, score_name: "", random_state: 0};
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "gene_list", this.properties.gene_list, (value) => {
        this.properties.gene_list = value;
        this.onWidgetValueChanged("gene_list", value);
    });
    this.addWidget("number", "ctrl_size", this.properties.ctrl_size, (value) => {
        this.properties.ctrl_size = Math.max(1, Math.round(value));
        this.onWidgetValueChanged("ctrl_size", value);
    }, {step: 10, precision: 0, min:30});
    this.addWidget("string", "gene_pool", this.properties.gene_pool, (value) => {
        this.properties.gene_pool = value;
        this.onWidgetValueChanged("gene_pool", value);
    });
    this.addWidget("number", "n_bins", this.properties.n_bins, (value) => {
        this.properties.n_bins = Math.max(1, Math.round(value));
        this.onWidgetValueChanged("n_bins", value);
    }, {step: 10, precision: 0, min: 0});
    this.addWidget("string", "score_name", this.properties.score_name, (value) => {
        this.properties.score_name = value;
        this.onWidgetValueChanged("score_name", value);
    });
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});
}

SGNode.title = "others-score_genes";

SGNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('SGNode input data:', filename);
            if (filename) {
                this.runSG(filename);
            }
        }, 100);
    }
};

SGNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('SGNode input data:', filename);
            if (filename) {
                this.runSG(filename);
                console.log('SGNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

SGNode.prototype.runSG = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/score_genes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            gene_list: this.properties.gene_list,
            ctrl_size: this.properties.ctrl_size,
            gene_pool: this.properties.gene_pool,
            n_bins: this.properties.n_bins,
            score_name: this.properties.score_name,
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
            console.log('SGNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

SGNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/score_genes", SGNode);


// Define the SGCCNode
function SGCCNode() {
    this.addInput("X", "string");
    this.addOutput("score-genes-cell-cycle_results", "string");
    this.properties = { filename: "", s_genes: "", g2m_genes: ""};
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "s_genes", this.properties.s_genes, (value) => {
        this.properties.s_genes = value;
        this.onWidgetValueChanged("s_genes", value);
    });
    this.addWidget("string", "g2m_genes", this.properties.g2m_genes, (value) => {
        this.properties.g2m_genes = value;
        this.onWidgetValueChanged("g2m_genes", value);
    });
}

SGCCNode.title = "others-score_genes_cell_cycle";

SGCCNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('SGCCNode input data:', filename);
            if (filename) {
                this.runSGCC(filename);
            }
        }, 100);
    }
};

SGCCNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('SGCCNode input data:', filename);
            if (filename) {
                this.runSGCC(filename);
                console.log('SGCCNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

SGCCNode.prototype.runSGCC = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/score_genes_cell_cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            s_genes: this.properties.s_genes,
            g2m_genes: this.properties.g2m_genes
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
            console.log('SGCCNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

SGCCNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/score_genes_cell_cycle", SGCCNode);
