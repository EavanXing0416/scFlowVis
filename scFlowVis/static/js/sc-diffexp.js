// Define the RGGNode
function RGGNode() {
    this.addInput("X", "string");
    this.addOutput("rank-genes-groups_results", "string");
    this.properties = { filename: "", groupby: "", groups: "all", reference: "rest", method: "t-test", corr_methos: "benjamini-hochberg", key_added: ""};
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "groupby", this.properties.groupby, (value) => {
        this.properties.groupby = value;
        this.onWidgetValueChanged("groupby", value);
    });
    this.addWidget("string", "groups", this.properties.groups, (value) => {
        this.properties.groups = value;
        this.onWidgetValueChanged("groups", value);
    });
    this.addWidget("string", "reference", this.properties.reference, (value) => {
        this.properties.reference = value;
        this.onWidgetValueChanged("reference", value);
    });
    this.addWidget("combo", "method", this.properties.method, (value) => {
        this.properties.method = value;
        this.onWidgetValueChanged("method", value);
    }, {values: ["t-test", "t-test_overestim_var", "wilcoxon", "logreg"]});
    this.addWidget("combo", "corr_methos", this.properties.corr_methos, (value) => {
        this.properties.corr_methos = value;
        this.onWidgetValueChanged("corr_methos", value);
    }, {values: ["benjamini-hochberg", "bonferroni"]});
    this.addWidget("string", "key_added", this.properties.key_added, (value) => {
        this.properties.key_added = value;
        this.onWidgetValueChanged("key_added", value);
    });
}

RGGNode.title = "de-rank_genes_groups";

RGGNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('RGGNode input data:', filename);
            if (filename) {
                this.runRGG(filename);
            }
        }, 100);
    }
};

RGGNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('RGGNode input data:', filename);
            if (filename) {
                this.runRGG(filename);
                console.log('RGGNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

RGGNode.prototype.runRGG = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/rank_genes_groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            groupby: this.properties.groupby,
            groups: this.properties.groups,
            reference: this.properties.reference,
            method: this.properties.method,
            corr_methos: this.properties.corr_methos,
            key_added: this.properties.key_added
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
            console.log('RGGNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

RGGNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/rank_genes_groups", RGGNode);


// Define the FRGGNode
function FRGGNode() {
    this.addInput("X", "string");
    this.addOutput("filter-rank-genes-groups_results", "string");
    this.properties = { filename: "", groupby: "", min_in_group_fraction: 0.25, min_fold_change: 1, max_out_group_fraction: 0.50,compare_abs: false, key_added: ""};
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "groupby", this.properties.groupby, (value) => {
        this.properties.groupby = value;
        this.onWidgetValueChanged("groupby", value);
    }); //groupby shoud select from the adata.obs -- each obs is assigened to a group
    this.addWidget("number", "min_in_group_fraction", this.properties.min_in_group_fraction, (value) => {
        this.properties.min_in_group_fraction = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("min_in_group_fraction", value);
    }, {step: 0.1, precision: 2, min: 0, max: 1});
    this.addWidget("number", "min_fold_change", this.properties.min_fold_change, (value) => {
        this.properties.min_fold_change = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("min_fold_change", value);
    }, {step: 10, precision: 0, min: 1});
    this.addWidget("number", "max_out_group_fraction", this.properties.max_out_group_fraction, (value) => {
        this.properties.max_out_group_fraction = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("max_out_group_fraction", value);
    }, {step: 0.1, precision: 2, min: 0, max: 1});
    this.addWidget("toggle", "compare_abs", this.properties.compare_abs, (value) => {
        this.properties.compare_abs = value;
        this.onWidgetValueChanged("compare_abs", value);
    });
    this.addWidget("string", "key_added", this.properties.key_added, (value) => {
        this.properties.key_added = value;
        this.onWidgetValueChanged("key_added", value);
    });
}

FRGGNode.title = "de-filter_rank_genes_groups";

FRGGNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('FRGGNode input data:', filename);
            if (filename) {
                this.runFRGG(filename);
            }
        }, 100);
    }
};

FRGGNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('FRGGNode input data:', filename);
            if (filename) {
                this.runFRGG(filename);
                console.log('FRGGNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

FRGGNode.prototype.runFRGG = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/filter_rank_genes_groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            groupby: this.properties.groupby,
            min_in_group_fraction: this.properties.min_in_group_fraction,
            min_fold_change: this.properties.min_fold_change,
            max_out_group_fraction: this.properties.max_out_group_fraction,
            compare_abs: this.properties.compare_abs,
            key_added: this.properties.key_added
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
            console.log('FRGGNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

FRGGNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/filter_rank_genes_groups", FRGGNode);

// Define the MGONode
function MGONode() {
    this.addInput("X", "string");
    this.addOutput("marker-gene-overlap_results", "string");
    this.properties = { filename: "", reference_markers: "", key:'rank_genes_groups', method:'overlap_count', normalize:null, top_n_markers:null, adj_pval_threshold:null, key_added:'marker_gene_overlap'}; 
    this.color = "#254030";

    // 添加控件
    this.addWidget("string", "reference_markers", this.properties.reference_markers, (value) => {
        this.properties.reference_markers = value;
        this.onWidgetValueChanged("reference_markers", value);
    });
    this.addWidget("string", "key", this.properties.key, (value) => {
        this.properties.key = value;
        this.onWidgetValueChanged("key", value);
    });
    this.addWidget("combo", "method", this.properties.method, (value) => {
        this.properties.method = value;
        this.onWidgetValueChanged("method", value);
    }, {values: ['overlap_count', 'overlap_coef', 'jaccard']});
    this.addWidget("combo", "normalize", this.properties.normalize, (value) => {
        this.properties.normalize = value;
        this.onWidgetValueChanged("normalize", value);
    }, {values: ['data', 'reference', null]});
    this.addWidget("number", "top_n_markers", this.properties.top_n_markers, (value) => {
        this.properties.top_n_markers = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("top_n_markers", value);
    }, {step: 10, precision: 0, min: 1});
    this.addWidget("number", "adj_pval_threshold", this.properties.adj_pval_threshold, (value) => {
        this.properties.adj_pval_threshold = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("adj_pval_threshold", value);
    }, {step: 0.01, precision: 2, min: 0, max: 1});
    this.addWidget("string", "key_added", this.properties.key_added, (value) => {
        this.properties.key_added = value;
        this.onWidgetValueChanged("key_added", value);
    });
}       

MGONode.title = "de-marker_gene_overlap";

MGONode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('MGONode input data:', filename);
            if (filename) {
                this.runMGO(filename);
            }
        }, 100);
    }
};

MGONode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('MGONode input data:', filename);
            if (filename) {
                this.runMGO(filename);
                console.log('MGONode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

MGONode.prototype.runMGO = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";

    fetch('/tl/marker_gene_overlap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            reference_markers: this.properties.reference_markers,
            key: this.properties.key,
            method: this.properties.method,
            normalize: this.properties.normalize,
            top_n_markers: this.properties.top_n_markers,
            adj_pval_threshold: this.properties.adj_pval_threshold,
            key_added: this.properties.key_added
           
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
            console.log('MGONode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

MGONode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/marker_gene_overlap", MGONode);