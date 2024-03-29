
    
    // 初始化 LiteGraph
    var graph = new LiteGraph.LGraph();
    var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);

    // 创建自定义节点
    function MyNode() {
        this.addInput("Input", "string");
        this.addOutput("Output", "string");
        this.properties = { value: 0 };
    }

    // 名称和执行逻辑
    MyNode.title = "ProcessDataNode";
    MyNode.prototype.onExecute = function() {
        // 从输入获取数据，这里假设 input 是包含必要参数的对象
        var input = this.getInputData(0);
        if (input !== undefined) {
            // 准备发送到 Flask 后端的数据
            var dataToSend = {
                min_genes: input.min_genes,
                min_cells: input.min_cells,
                n_pcs: input.n_pcs,
                n_neighbors: input.n_neighbors,
                leiden_resolution: input.leiden_resolution
            };

            // 发送请求到 Flask 后端的 /process 路由
            fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            })
            .then(response => response.json())
            .then(data => {
                // 处理返回的数据
                // 假设返回的数据是一个包含 UMAP 结果、聚类和细胞信息的对象
                this.setOutputData(0, data.umap);
                this.setOutputData(1, data.clusters);
                this.setOutputData(2, data.cells);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    LiteGraph.registerNodeType("demo/myNode", MyNode);

    // 使用节点
    var node = LiteGraph.createNode("demo/myNode");
    graph.add(node);
