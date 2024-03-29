        // 处理数据并绘图
        function processData() {
            let minGenes = document.getElementById('min-genes').value;
            let minCells = document.getElementById('min-cells').value;
            let nPCs = document.getElementById('n_pcs').value;
            let nNeighbors = document.getElementById('n_neighbors').value;
            let leidenResolution = document.getElementById('leiden_resolution').value;

            fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({min_genes: minGenes, min_cells: minCells, n_pcs: nPCs, n_neighbors: nNeighbors,leiden_resolution: leidenResolution})
            })
            .then(response => response.json())
            .then(data => {
                // 使用D3.js绘制UMAP散点图
                drawScatterPlot(data, "scatter-plot");
                // 在这里直接打印数据
                //console.log(data.umap);
                //console.log(data.clusters);
                //console.log(data.cells) // 打印到控制台
                // 或者打印到页面元素
                //document.getElementById('scatter-plot').textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => console.error('Error:', error));
        }

        function drawScatterPlot(data, elementId) {
            const width = 400, height = 400;
        
            // 创建一个包裹SVG和按钮的容器
            const svgContainer = document.createElement("div");
            svgContainer.style.width = "24%";  // 设置容器宽度为页面宽度的33%
            svgContainer.style.display = "inline-block";  // 使容器呈现为内联块元素
            svgContainer.style.verticalAlign = "top";  // 顶部对齐，如果有多个SVG容器
            svgContainer.style.padding = "5px";  // 添加一些内边距
            // 创建 SVG 元素
            const svg = d3.select(svgContainer).append("svg")
            .attr("width", width)
            .attr("height", height);
            // 创建 SVG 元素
            //const svg = d3.select(`#${elementId}`).append("svg")
            //    .attr("width", width)
            //    .attr("height", height);
        
            const g = svg.append("g");
        
            // 创建比例尺
            const xScale = d3.scaleLinear()
                .domain([d3.min(data.umap, d => d[0]), d3.max(data.umap, d => d[0])])
                .range([0, width]);
        
            const yScale = d3.scaleLinear()
                .domain([d3.min(data.umap, d => d[1]), d3.max(data.umap, d => d[1])])
                .range([height, 0]);
        
            // 创建散点
            const dots = g.selectAll(".dot")
                .data(data.umap)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d[0]))
                .attr("cy", d => yScale(d[1]))
                .attr("r", 5)
                .style("fill", (d, i) => d3.schemeCategory10[data.clusters[i] % 10]+ "99")
                .style("stroke", (d, i) => d3.schemeCategory10[data.clusters[i] % 10]);

            // 创建删除按钮
            const removeButton = document.createElement("button");
            removeButton.textContent = "Delete";
            removeButton.style.margin = "10px";  // 根据需要调整样式
            removeButton.onclick = function() {
                // 删除SVG容器
                svgContainer.remove();
            };

            // 将SVG容器（包含SVG和按钮）添加到指定的div中
            document.getElementById(elementId).appendChild(svgContainer);
            svgContainer.appendChild(removeButton);
        
            // 创建一个悬停提示框
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
        
            dots.on("mouseover", (event, d) => {
                const index = data.umap.indexOf(d);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(data.cells[index])
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 5) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
            // 添加缩放功能
            svg.call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
                // 根据缩放级别调整点的大小
                const newRadius = 3 / Math.sqrt(event.transform.k);
                dots.attr("r", newRadius);
            }));
        }

