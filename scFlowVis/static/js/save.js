//Add the clear button event listener
document.getElementById('clear-workflow').addEventListener('click', function() {
    console.log('clear button clicked');
    // 清空LiteGraph的图形
    graph.clear();
});

// Add the save button event listener
document.getElementById('save-workflow').addEventListener('click', function() {
    console.log('save-workflow button clicked');

    // 获取LiteGraph的canvas元素
    var canvasElement = canvas.canvas;

    // 将canvas的内容转换为数据URL
    var dataUrl = canvasElement.toDataURL('image/png');

    // 创建一个新的<a>元素，用于下载图像
    var link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'workflow.png';

    // 触发<a>元素的click事件，开始下载
    link.click();
});


//document.getElementById('export-wholepage').addEventListener('click', function() {
    //console.log("export-wholepage btn clicked");
    //var blob = new Blob([document.documentElement.outerHTML], {type: "text/html;charset=utf-8"});
    //saveAs(blob, "output.html");

    
//});
document.getElementById('export-wholepage').addEventListener('click', function() {
    console.log("export-wholepage btn clicked");

    // Save the canvas content as workflow.json
    var data = JSON.stringify(graph.serialize());
    var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "workflow.json");

    // Create a new script element
    var readGraphJsonScript = `
        <script>
            window.onload = function() {
                // Initialize LiteGraph
                var graph = new LiteGraph.LGraph();
                var canvas = new LiteGraph.LGraphCanvas("#mycanvas", graph);

                // Fetch the JSON data from the workflow.json file
                fetch('workflow.json')
                    .then(response => response.json())
                    .then(data => {
                        // Use the JSON data to configure the graph
                        graph.configure(data);
                        graph.start();
                    })
                    .catch(error => console.error('Error:', error));
            };
        </script>
    `;

    // Add the script element to the end of the HTML string
    var html = document.documentElement.outerHTML + readGraphJsonScript;

    // Delay the saving of output.html to ensure workflow.json has been saved
    setTimeout(function() {
        console.log("export-wholepage btn clicked");
        var blob = new Blob([html], {type: "text/html;charset=utf-8"});
        saveAs(blob, "output.html");
    }, 1000);  // Delay for 1 second
});