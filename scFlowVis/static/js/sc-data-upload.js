//Upload Node
function uploadFile(files) {
    if (!files || files.length !== 3) {
        alert("Please choose three files to upload: barcodes.tsv, genes.tsv, matrix.mtx.");
        return Promise.reject(new Error("Invalid file input"));
    }

    var formData = new FormData();
    formData.append('file_barcodes', files[0]); // match with Flask backend
    formData.append('file_genes', files[1]); // match with Flask backend
    formData.append('file_matrix', files[2]); // match with Flask backend

    return fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
}

// Define the UploadNode
function UploadNode() {
    this.addOutput("Data", "string");
    this.properties = { filename: "" , dim: "", nnz_rate:""};
    this.color = "#5F5B52"
    this.addWidget("button", "Upload File", "", this.onButtonClick.bind(this));
}

UploadNode.title = "Upload Data";

UploadNode.prototype.onButtonClick = function() {
    // Create a file input element
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; // Allow multiple files
    fileInput.onchange = (event) => {
        // Call the uploadFile function when the button is clicked
        var files = event.target.files; // This is now a FileList object
        uploadFile(files).then(data => {
            console.log('UploadNode input data:', data);
            // Set the output data
            this.setOutputData(0, data.filename);
            this.properties.filename = data.filename;
            this.properties.dim = data.dim;
            this.properties.nnz_rate = data.nnz_rate;

            console.log('UploadNode output data:', this.getOutputData(0));
        });
    };

    // Simulate a click on the file input element
    fileInput.click();
};

UploadNode.prototype.onConnectionsChange = function(connectionType, slot, connected, linkInfo) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.OUTPUT && connected) {
        var filename = this.getOutputData(slot);
        console.log('UploadNode output data:', filename);
    }
};

UploadNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/data/upload", UploadNode);


// Define the ImportNode
function ImportNode() {
    this.addOutput("Data", "string");
    this.properties = { filename: ""};
    this.color = "#5F5B52"
    this.addWidget("button", "Import File", "", this.onButtonClick.bind(this));
}

ImportNode.title = "Import Data";

ImportNode.prototype.onButtonClick = function() {
    // Create a file input element
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    //fileInput.multiple = true; // Allow multiple files
    fileInput.onchange = (event) => {
        // Call the importFile function when the button is clicked
        // Get the file name
        var filename = event.target.files[0].name;
        console.log('Selected file:', filename);

        // Set the output data
        this.setOutputData(0, filename);
        console.log('ImportNode output data:', this.getOutputData(0));
    };

    // Simulate a click on the file input element
    fileInput.click();
};

ImportNode.prototype.onConnectionsChange = function(connectionType, slot, connected, linkInfo) {
    console.log('onConnectionsChange called');
    if (connectionType === LiteGraph.OUTPUT && connected) {
        var filename = this.getOutputData(slot);
        console.log('ImportNode output data:', filename);
    }
};

ImportNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
        this.properties.filename = filename;
    }
};

LiteGraph.registerNodeType("scanpy/data/import", ImportNode);


// Define the Scanpy Datasets installing Node
//datasets_install
function DatasetsNode() {
    this.addOutput("Data", "string");
    this.properties = { filename: "" , dataset_name:""};
    this.color = "#5F5B52"
    this.addWidget("combo", "dataset_name", this.properties.dataset_name, (value) => {
        this.properties.dataset_name = value;
        this.onWidgetValueChanged("dataset_name", value);
    }, { values: ["pbmc68k_reduced", "pbmc3k", "pbmc3k_processed", "moignard15", "krumsiek11", "paul15"] });
}

DatasetsNode.title = "Datasets Install";

DatasetsNode.prototype.onConnectionsChange = function(connectionType, slot, connected) {
    console.log('onConnectionsChange called');
    //if (connectionType === LiteGraph.INPUT && connected) {
        setTimeout(() => {
            dataset_name = this.properties.dataset_name;
            console.log('DatasetsNode datasets name:', dataset_name);
            if (dataset_name) {
                this.runDatasets();
            }
        }, 100);
    //}
};

DatasetsNode.prototype.onWidgetValueChanged = function(name, value) {
    console.log('onWidgetValueChange called');
    //if (this.inputs && this.inputs.length > 0 && this.inputs[0].link != null) {
        setTimeout(() => {
            dataset_name = this.properties.dataset_name;
            console.log('DatasetsNode datasets name:', dataset_name);
            if (dataset_name) {
                this.runDatasets();
            }
        }, 100);
    //}
};

DatasetsNode.prototype.runDatasets = function(filename) {
    this.properties.filename = filename;
    //this.color = '#697565';

    fetch('/importScDataSets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dataset_name: this.properties.dataset_name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            throw new Error(data.error);
        } else {
            this.setOutputData(0, data.filename);
            //this.color = "#4D6772";
            console.log('DatasetsNode output:', data.filename);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        //this.color = "#756865";
    });
};

DatasetsNode.prototype.onExecute = function() {
    // Update the output data
    var filename = this.getOutputData(0);
    if (filename) {
        this.setOutputData(0, filename);
    }
};

LiteGraph.registerNodeType("scanpy/data/datasets", DatasetsNode);