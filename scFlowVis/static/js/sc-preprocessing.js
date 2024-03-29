// preprocessNodes
// filter
function filterNode() {
    this.addInput("X", "string");
    this.addOutput("preprocess_results", "string");
    this.properties = { filename: "", make_var_name_unique: true, filter_cells: 0, filter_genes: 0}; //calculate_qc_matrics: false
    this.color = "#254030";
    // Widgets
    this.addWidget("toggle", "make gene id unique", this.properties.make_var_name_unique, (value) => {
        this.properties.make_var_name_unique = !!value; 
        this.onWidgetValueChanged("make gene id unique", value);
    });
    this.addWidget("number", "filter_cells", this.properties.filter_cells, (value) => {
        this.properties.filter_cells = Math.max(0, Math.round(value)); 
        this.onWidgetValueChanged("filter_cells", value);
    }, {step: 10, precision: 0, min: 0});
    this.addWidget("number", "filter_genes", this.properties.filter_genes, (value) => {
        this.properties.filter_genes = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("filter_genes", value);
    }, {step: 10, precision: 0, min: 0});
    //this.addWidget("toggle", "calculate qc matrics", this.properties.calculate_qc_matrics, (value) => {
    //    this.properties.calculate_qc_matrics = !!value; 
    //    this.onWidgetValueChanged("calculate_qc_matrics", value);
    //});
}

filterNode.title = "pp-filter";

filterNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('filterNode input data:', filename);
            if (filename) {
                this.runPreprocess(filename);
            }
        }, 100);
    }
};

filterNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('filterNode input data:', filename);
            if (filename) {
                this.runPreprocess(filename);
                //console.log('NeighborNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

filterNode.prototype.runPreprocess = function(filename) {
    this.properties.filename = filename;
    this.color = "#697565";
    fetch('/pp/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            filter_cells: this.properties.filter_cells,
            filter_genes: this.properties.filter_genes,
            make_var_name_unique: this.properties.make_var_name_unique,
            //calculate_qc_matrics: this.properties.calculate_qc_matrics
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
            console.log('filterNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

filterNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/filter", filterNode);


// qcm calculation
function qcNode() {
    this.addInput("input file", "string");
    this.addOutput("output file", "string");
    this.properties = { filename: "", cell_level_qcm_calculated:"", gene_level_qcm_calculated:"" }; //calculate_qc_matrics: false
    this.color = "#254030";
}

qcNode.title = "pp-qc";

qcNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('qcNode input data:', filename);
            if (filename) {
                this.runPreprocess(filename);
            }
        }, 100);
    }
};

qcNode.prototype.runPreprocess = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';
    fetch('/pp/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            throw new Error(data.error);
        } else {
            this.properties.filename = data.newFilename;
            this.properties.cell_level_qcm_calculated = data.cell_level_qcm;
            this.properties.gene_level_qcm_calculated = data.gene_level_qcm;
            this.setOutputData(0, data.newFilename);
            this.color = "#254030";
            console.log('filterNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

qcNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/calculate_qc_metrics", qcNode);


// neighbors
function NeighborNode() {
    this.addInput("X", "string");
    this.addOutput("neighbor_results", "string");
    this.properties = { filename: "",n_neighbors: 15, n_pcs: null, knn: true, random_state: 0, method: 'umap', metric: 'euclidean'};
    this.color = "#254030";

    // 添加控件
    this.addWidget("number", "n_neighbors", this.properties.n_neighbors, (value) => {
        this.properties.n_neighbors = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_neighbors", value);
    }, {step: 10, precision: 0, min: 2, max: 100});
    this.addWidget("number", "n_pcs", this.properties.n_pcs, (value) => {
        this.properties.n_pcs = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_pcs", value);
    }, {step: 10, precision: 0, min: 0, max: 100});
    this.addWidget("toggle", "knn", this.properties.knn, (value) => {
        this.properties.knn = !!value; 
        this.onWidgetValueChanged("knn", value);
    });
    this.addWidget("number", "random_state", this.properties.random_state, (value) => {
        this.properties.random_state = Math.max(0, Math.round(value));
        this.onWidgetValueChanged("random_state", value);
    }, {step: 10, precision: 0, min: 0});
    this.addWidget("combo", "method", this.properties.method, (value) => {
        this.properties.method = value;
        this.onWidgetValueChanged("method", value);
    }, { values: ['umap', 'gauss'] });
    this.addWidget("combo", "metric", this.properties.metric, (value) => {
        this.properties.metric = value;
        this.onWidgetValueChanged("metric", value);
    }, { values: ['cityblock', 'cosine', 'euclidean', 'l1', 'l2', 'manhattan', 'braycurtis', 'canberra', 'chebyshev', 'correlation', 'dice', 'hamming', 'jaccard', 'kulsinski', 'mahalanobis', 'minkowski', 'rogerstanimoto', 'russellrao', 'seuclidean', 'sokalmichener', 'sokalsneath', 'sqeuclidean', 'yule'] });
}

NeighborNode.title = "pp-neighbors";

NeighborNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('NeighborNode input data:', filename);
            if (filename) {
                this.runNeighbor(filename);
            }
        }, 100);
    }
};

NeighborNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('NeighborNode input data:', filename);
            if (filename) {
                this.runNeighbor(filename);
                console.log('NeighborNode output data:', this.getOutputData(0));
            }
        }, 100);
    }
};

NeighborNode.prototype.runNeighbor = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/neighbor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_neighbors: this.properties.n_neighbors,
            n_pcs: this.properties.n_pcs,
            knn: this.properties.knn,
            random_state: this.properties.random_state,
            method: this.properties.method,
            metric: this.properties.metric 
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
            console.log('NeighborNode output:', data.newFilename);
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

NeighborNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/neighbors", NeighborNode);



//highly_variable_genes
function HighlyVarGenesNode() {
    this.addInput("filename", "string");
    this.addOutput("hvg_results", "string");
    this.properties = {filename: "", n_top_genes: 1000, flavor: 'seurat', min_mean: 0.0125, max_mean: 3, min_disp: 0.5, max_disp: 100, span: 0.3, n_bins: 20, inplace: true};
    this.color = "#254030";
    this.addWidget("number", "n_top_genes", this.properties.n_top_genes, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.n_top_genes = null;
        } else {
        this.properties.n_top_genes = Math.max(1, Math.round(value));
        }
        this.onWidgetValueChanged("n_top_genes", value);
    }, {step: 10, precision: 0, min: 1, max: 10000});
    this.addWidget("combo", "flavor", this.properties.flavor, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.flavor = null;
        } else {
        this.properties.flavor = value;
        }
        this.onWidgetValueChanged("flavor", value);
    }, { values: ['seurat', 'cell_ranger', 'seurat_v3', 'seurat_v3_paper'] });
    this.addWidget("number", "min_mean", this.properties.min_mean, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.min_mean = null;
        } else {
        this.properties.min_mean = value;
        }
        this.onWidgetValueChanged("min_mean", value);
    }, {step: 0.01, precision: 4});
    this.addWidget("number", "max_mean", this.properties.max_mean, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.max_mean = null;
        } else {
        this.properties.max_mean = value;
        }
        this.onWidgetValueChanged("max_mean", value);
    }, {step: 0.01, precision: 4});
    this.addWidget("number", "min_disp", this.properties.min_disp, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.min_disp = null;
        } else {
        this.properties.min_disp = value;
        }
        this.onWidgetValueChanged("min_disp", value);
    }, {step: 0.01, precision: 4});
    this.addWidget("number", "max_disp", this.properties.max_disp, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.max_disp = null;
        } else {
        this.properties.max_disp = value;
        }
        this.onWidgetValueChanged("max_disp", value);
    }, {step: 0.01, precision: 4});
    this.addWidget("number", "span", this.properties.span, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.span = null;
        } else {
        this.properties.span = value;
        }
        this.onWidgetValueChanged("span", value);
    }, {step: 0.1, precision: 3});
    this.addWidget("number", "n_bins", this.properties.n_bins, (value) => {
        if (value === "" || value === undefined || value === null || value === 0) {
            this.properties.n_bins = null;
        } else {
        this.properties.n_bins = Math.max(1, Math.round(value));
        }
        this.onWidgetValueChanged("n_bins", value);
    }, {step: 10, precision: 0, min: 1, max: 100});
    this.addWidget("toggle", "inplace", this.properties.inplace, (value) => {
        this.properties.inplace = !!value;
        this.onWidgetValueChanged("inplace", value);
    });
}

HighlyVarGenesNode.title = "pp-highly_var_genes";

HighlyVarGenesNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('HighlyVarGenesNode input data:', filename);
            if (filename) {
                this.runHighlyVarGenes(filename);
            }
        }, 100);
    }
};

HighlyVarGenesNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('HighlyVarGenesNode input data:', filename);
            if (filename) {
                this.runHighlyVarGenes(filename);
            }
        }, 100);
    }
};

HighlyVarGenesNode.prototype.runHighlyVarGenes = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/highly_variable_genes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_top_genes: this.properties.n_top_genes,
            flavor: this.properties.flavor,
            min_mean: this.properties.min_mean,
            max_mean: this.properties.max_mean,
            min_disp: this.properties.min_disp,
            max_disp: this.properties.max_disp,
            span: this.properties.span,
            n_bins: this.properties.n_bins,
            inplace: this.properties.inplace
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
            console.log('HighlyVarGenesNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

HighlyVarGenesNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/highly_variable_genes", HighlyVarGenesNode);


//normalize_total
function NormalizeTotalNode() {
    this.addInput("filename", "string");
    this.addOutput("normalize_total_results", "string");
    this.properties = {filename: "", target_sum: null, exclude_highly_expressed: false, max_fraction: 0.05, key_added: "", inplace: true};
    this.color = "#254030";
    this.addWidget("number", "target_sum", this.properties.target_sum, (value) => {
        if (value === "") {
            this.properties.target_sum = null;
        } else {
            this.properties.target_sum = value;
        }
        this.onWidgetValueChanged("target_sum", value);
    }, {step: 1, precision: 1, min: 1, max: 1e6});
    this.addWidget("toggle", "exclude_highly_expressed", this.properties.exclude_highly_expressed, (value) => {
        if (value === "") {
            this.properties.exclude_highly_expressed = false;
        } else {
        this.properties.exclude_highly_expressed = !!value;
        } 
        this.onWidgetValueChanged("exclude_highly_expressed", value);
    });
    this.addWidget("number", "max_fraction", this.properties.max_fraction, (value) => {
        if (value === "") {
            this.properties.max_fraction = null;
        } else {
        this.properties.max_fraction = value;
        }
        this.onWidgetValueChanged("max_fraction", value);
    }, {step: 0.1, precision: 2, min: 0, max: 1});
    this.addWidget("string", "key_added", this.properties.key_added, (value) => {
        if (value === "") {
            this.properties.key_added = null;
        } else {
        this.properties.key_added = value;
        }
        this.onWidgetValueChanged("key_added", value);
    });
    this.addWidget("toggle", "inplace", this.properties.inplace, (value) => {
        if (value === "") {
            this.properties.inplace = true;
        } else {
        this.properties.inplace = !!value;
        }
        this.onWidgetValueChanged("inplace", value);
    });
}

NormalizeTotalNode.title = "pp-normalize_total";

NormalizeTotalNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('NormalizeTotalNode input data:', filename);
            if (filename) {
                this.runNormalizeTotal(filename);
            }
        }, 100);
    }
};

NormalizeTotalNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('NormalizeTotalNode input data:', filename);
            if (filename) {
                this.runNormalizeTotal(filename);
            }
        }, 100);
    }
};

NormalizeTotalNode.prototype.runNormalizeTotal = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/normalize_total', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            target_sum: this.properties.target_sum,
            exclude_highly_expressed: this.properties.exclude_highly_expressed,
            max_fraction: this.properties.max_fraction,
            key_added: this.properties.key_added,
            inplace: this.properties.inplace
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
            console.log('NormalizeTotalNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

NormalizeTotalNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/normalize_total", NormalizeTotalNode);

//log1p
function Log1pNode() {
    this.addInput("filename", "string");
    this.addOutput("log1p_results", "string");
    this.properties = {filename: "", base: Math.E};
    this.color = "#254030";
    this.addWidget("number", "base", this.properties.base, (value) => {
        this.properties.base = value;
        this.onWidgetValueChanged("base", value);
    }, {step: 0.1, precision: 2, min: 0, max: 10});
}

Log1pNode.title = "pp-log1p";

Log1pNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('Log1pNode input data:', filename);
            if (filename) {
                this.runLog1p(filename);
            }
        }, 100);
    }
};

Log1pNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('Log1pNode input data:', filename);
            if (filename) {
                this.runLog1p(filename);
            }
        }, 100);
    }
};

Log1pNode.prototype.runLog1p = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/log1p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            base: this.properties.base
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
            console.log('Log1pNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
};

Log1pNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/methods/log1p", Log1pNode);


//regress_out
function RegressOutNode() {
    this.addInput("filename", "string");
    this.addOutput("regress_out_results", "string");
    this.properties = {filename: "", keys: ""};
    this.color = "#254030";
    this.addWidget("string", "keys", this.properties.keys, (value) => {
        this.properties.keys = value;
        this.onWidgetValueChanged("keys", value);
    });
}

RegressOutNode.title = "pp-regress_out";

RegressOutNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('RegressOutNode input data:', filename);
            if (filename) {
                this.runRegressOut(filename);
            }
        }, 100);
    }
}

RegressOutNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('RegressOutNode input data:', filename);
            if (filename) {
                this.runRegressOut(filename);
            }
        }, 100);
    }
}

RegressOutNode.prototype.runRegressOut = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/regress_out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            keys: this.properties.keys
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
            console.log('RegressOutNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
}

RegressOutNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
}

LiteGraph.registerNodeType("scanpy/methods/regress_out", RegressOutNode);


//scale
function ScaleNode() {
    this.addInput("filename", "string");
    this.addOutput("scale_results", "string");
    this.properties = {filename: "", zero_center: true, max_value: null};
    this.color = "#254030";
    this.addWidget("toggle", "zero_center", this.properties.zero_center, (value) => {
        this.properties.zero_center = !!value;
        this.onWidgetValueChanged("zero_center", value);
    });
    this.addWidget("number", "max_value", this.properties.max_value, (value) => {
        this.properties.max_value = value;
        this.onWidgetValueChanged("max_value", value);
    }, {step: 0.1, precision: 2, min: 0, max: 100});
}

ScaleNode.title = "pp-scale";

ScaleNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('ScaleNode input data:', filename);
            if (filename) {
                this.runScale(filename);
            }
        }, 100);
    }
}

ScaleNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('ScaleNode input data:', filename);
            if (filename) {
                this.runScale(filename);
            }
        }, 100);
    }
}

ScaleNode.prototype.runScale = function(filename) {
    this.properties.filename = filename;
    this.color = '#697565';

    fetch('/pp/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            zero_center: this.properties.zero_center,
            max_value: this.properties.max_value
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
            console.log('ScaleNode output:', data.newFilename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        this.color = "#756865";
    });
}

ScaleNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
}

LiteGraph.registerNodeType("scanpy/methods/scale", ScaleNode);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// preprocessVisNode
// qcVis
function qcVis() {
    this.addInput("filename", "string");
    this.properties = {qcm:"obs: n_genes_by_counts"};
    this.color = "#4D6772";
    this.addWidget("combo", "qcm", this.properties.qcm, (value) => {
        this.properties.qcm = value;
        this.onWidgetValueChanged("qcm", value);
    }, { values: ['obs: n_genes_by_counts', 'obs: log1p_n_genes_by_counts', 'obs: total_counts', 'obs: log1p_total_counts', 'obs: pct_counts_in_top_50_genes', 'obs: pct_counts_in_top_100_genes', 'obs: pct_counts_in_top_200_genes', 'obs: pct_counts_in_top_500_genes', 
    'var: n_cells_by_counts', 'var: mean_counts', 'var: log1p_mean_counts', 'var: pct_dropout_by_counts', 'var: total_counts', 'var: log1p_total_counts'] });
}

qcVis.title = "vis-qc";

qcVis.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('qcVis input data:', filename);
            if (filename) {
                this.runQcVis(filename);
            }
        }, 100);
    }
};
qcVis.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('qcVis input data:', filename);
            if (filename) {
                this.runQcVis(filename);
            }
        }, 100);
    }
};

qcVis.prototype.runQcVis = function(filename) {
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
                ${this.title.substring(4)}
            </a>`;
        document.getElementById('myTab'+i).appendChild(newTab);

        // Create a new div for the visualization
        var newDiv = document.createElement('div');
        newDiv.className = 'tab-pane fade';
        newDiv.id = id;
        //console.log(newDiv.id);
        document.getElementById('myTabContent'+i).appendChild(newDiv);
    }
    console.log(ids);

    // Create the visualization in the new div  
    // Show the loading message
    var loadingDiv = document.getElementById('loading-message');
    loadingDiv.innerHTML = 'Loading...';
    //
    fetch('/pp/vis/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            qcm: this.properties.qcm.split(": ")[1] //'obs: n_genes_by_counts' -> 'n_genes_by_counts'
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

            //get the subset of data:
            var qcm = this.properties.qcm.split(": ")[1];
            console.log(qcm);
            console.log(Object.keys(data.qcm_cell).includes(qcm));
            if(Object.keys(data.qcm_cell).includes(qcm)
                //qcm in Object.keys(data.qcm_cell)
                ){
                var qcm_data = data.qcm_cell[qcm];
            }else{ qcm_data = data.qcm_gene[qcm];}
            //console.log(qcm_data);

            // Create a histogram with Plotly
            var trace = {
                x: Object.values(qcm_data),
                type: 'histogram',
                marker: {
                    color: 'rgba(100,149,237,0.6)',
                    line: {
                        color: 'rgba(100,149,237,1)',
                        width: 1
                    }
                },
            };
            var layout = {
                //title: 'Frequency Distribution of '+qcm,
                xaxis: { title: qcm },
                yaxis: { title: 'Frequency' }
            };
            /**
            ids.forEach((id,index) => {
                console.log(id);
                var tab_no = index+1;
                Plotly.newPlot(id, trace, layout).then(() => console.log('Plotted'));
                $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');
            });
             */
            async function createPlots(ids, trace, layout) {
                for (let index = 0; index < ids.length; index++) {
                    let id = ids[index];
                    console.log(id);
                    let tab_no = index+1;
                    await Plotly.newPlot(id, [trace], layout);
                    $('#myTab'+ tab_no +' a[href="#' + id + '"]').tab('show');
                }
            }

            // Then call this function with your parameters
            createPlots(ids, trace, layout).then(() => console.log('All plots created'));
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
};

LiteGraph.registerNodeType("scanpy/vis/qc", qcVis);



// highest expressed genes: Show those genes that yield the highest fraction of counts in each single cell, across all cells.
function HighestExprGenesNode() {
    console.log('HighestExprGenesNode added');
    this.addInput("filename", "string");
    this.properties = { n_top: 20 };
    this.color = "#4D6772";
    this.addWidget("number", "n_top", this.properties.n_top, (value) => {
        this.properties.n_top = Math.max(1, Math.round(value)); 
        this.onWidgetValueChanged("n_top", value);
    }, {step: 10, precision: 0, min: 1, max: 100}
    ); 
}

HighestExprGenesNode.title = "vis-highest_expr_genes";

HighestExprGenesNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            var filename = this.getInputData(slot);
            console.log('HighestExprGenesNode input data:', filename);
            if (filename) {
                this.runHighestExprGenes(filename);
            }
        }, 100);
    }
};
HighestExprGenesNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            var filename = this.getInputData(0);
            console.log('HighestExprGenesNode input data:', filename);
            if (filename) {
                this.runHighestExprGenes(filename);
            }
        }, 100);
    }
};

HighestExprGenesNode.prototype.runHighestExprGenes = function(filename) {
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
                ${this.title.substring(4)}
            </a>`;
        document.getElementById('myTab'+i).appendChild(newTab);

        // Create a new div for the visualization
        var newDiv = document.createElement('div');
        newDiv.className = 'tab-pane fade';
        newDiv.id = id;
        //console.log(newDiv.id);
        document.getElementById('myTabContent'+i).appendChild(newDiv);
    }
    console.log(ids);

    // Create the visualization in the new div  
    // Show the loading message
    var loadingDiv = document.getElementById('loading-message');
    loadingDiv.innerHTML = 'Loading...';
    //
    fetch('/pp/vis/qc/highest_expr_genes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_top: this.properties.n_top
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
            // Create a box plot with Plotly for each gene
            var colors = d3.scaleOrdinal(d3.schemeCategory10).range();
            var traces = data.genes.map((gene, i) => {
                return {
                    y: data.total_genes[i],
                    type: 'box',
                    name: gene,
                    marker: {
                        color: colors[i % colors.length]
                    },
                };
            });
            var layout = {
                title: 'Highest Expressed Genes',
                yaxis: { title: 'Expression' },
                xaxis: { title: 'Genes' }
            };
            
            ids.forEach((id,index) => {
                console.log(id);
                var tab_no = index+1;
                Plotly.newPlot(id, traces, layout).then(() => console.log('Plotted'));
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

    
};
/*Old-version*/
/*
HighestExprGenesNode.prototype.runHighestExprGenes = function(filename) {
    // Generate a unique ID for the new tab and div
    var id = 'tab' + Date.now();

    // Create a new tab
    var newTab = document.createElement('li');
    newTab.className = 'nav-item';
    newTab.innerHTML = `
        <a class="nav-link" id="${id}-tab" data-toggle="tab" href="#${id}" role="tab" aria-controls="${id}" aria-selected="false">
            
            <button type="button" class="close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button> 
            ${this.title.substring(4)}   
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
    // Show the loading message
    newDiv.innerHTML = 'Loading...';
    //
    fetch('/pp/vis/qc/highest_expr_genes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: filename,
            n_top: this.properties.n_top
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
            newDiv.innerHTML = 'Error: ' + data.error;
        } else {
            // Clear the loading message
            newDiv.innerHTML = '';
            // Create a box plot with Plotly for each gene
            var colors = d3.scaleOrdinal(d3.schemeCategory10).range();
            var traces = data.genes.map((gene, i) => {
                return {
                    y: data.total_genes[i],
                    type: 'box',
                    name: gene,
                    marker: {
                        color: colors[i % colors.length]
                    },
                };
            });
            var layout = {
                title: 'Highest Expressed Genes',
                yaxis: { title: 'Expression' },
                xaxis: { title: 'Genes' }
            };
            Plotly.newPlot(id, traces, layout).then(() => console.log('Plotted'));
            $('#myTab a[href="#' + id + '"]').tab('show');
        }
    })
    .catch(error => {
        // Show the error message
        newDiv.innerHTML = 'Error: ' + error.message;
    });
};
*/

LiteGraph.registerNodeType("scanpy/vis/highest_expr_genes", HighestExprGenesNode);

