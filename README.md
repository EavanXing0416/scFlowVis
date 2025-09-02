# scFlowVis
scFlowVis is an interactive visual analytics tool designed to facilitate the analysis of single-cell RNA sequencing (scRNA-seq) data. Built on top of **Scanpy** for data processing and implemented within a **Flask** backend framework, it integrates a comprehensive suite of scRNA-seq analysis methods. On the frontend, scFlowVis leverages modern visualization libraries such as **Graph.js** and **Plotly.js** to provide interactive exploration, dynamic visualization of data structures, and intuitive parameter tuning. The system enables users to navigate the complete scRNA-seq analysis pipeline within a unified interface, while also documenting the full analysis workflow.


# Demo
![scFlowVis](https://github.com/EavanXing0416/scFlowVis/assets/61351534/3a390c45-8058-45a5-859d-b3cc644cfdf6)

# Installation
To run scFlowVis locally, please follow these steps:

### 1. Clone the Repository
```
git clone https://github.com/EavanXing0416/scFlowVis.git
cd scFlowVis
```
### 2. Set Up a Virtual Environment (Optional, but recommended)
```
python -m venv venv
source venv/bin/activate`  # On Windows use `venv\Scripts\activate`
```
### 3. Install Dependencies
```
pip install -r requirements.txt
```

### 4. Run the Application
```
flask run
```
By default, the application will be available at `http://127.0.0.1:5000/`.

# Contributing
We welcome contributions to scFlowVis! If you'd like to contribute, please fork the repository and use a pull request for any changes. 
