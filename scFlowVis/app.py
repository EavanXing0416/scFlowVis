from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import numpy as np
import pandas as pd
import scipy.io
from scipy.sparse import csr_matrix
import scanpy as sc
import json
import matplotlib
matplotlib.use('Agg') #allow matplotlib use 'Agg' backend，only generate fig without openup new window
import matplotlib.pyplot as plt
import mpld3
from mpld3 import plugins 
import os
import uuid
import sys
import ast

print(sys.executable)

app = Flask(__name__)

UPLOAD_FOLDER = 'static/data'
app.config['UPLOAD_FOLDER'] = 'static/data/save'

# Data Upload API
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        files = ['file_barcodes', 'file_genes', 'file_matrix']
        filenames = {}
        for file_key in files:
            if file_key not in request.files:
                return f'No {file_key} part', 400
            file = request.files[file_key]
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            filenames[file_key] = filepath

        # Read the 10x mtx file
        adata = sc.read_10x_mtx(
            os.path.dirname(filenames['file_matrix']),  # the directory with the `.mtx` file
            var_names='gene_symbols',                  # use gene symbols for the variable names (variables-axis index)
            cache=True                                  # write a cache file for faster subsequent reading
        )
        dim = adata.shape
        nnz_rate = adata.X.nnz / dim[0] / dim[1]
        print('data dimension:'+ str(dim))
        print(adata)
        h5ad_filename = f"{uuid.uuid4().hex}.h5ad"
        h5ad_filepath = os.path.join(app.config['UPLOAD_FOLDER'], h5ad_filename)
        adata.write(h5ad_filepath)
        return {'message': 'Files uploaded and converted to AnnData successfully', 'filename': h5ad_filename, 'dim': dim, 'nnz_rate': str(round(nnz_rate,5))}, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Scanpy dataset importing API
@app.route('/importScDataSets', methods=['POST'])
def import_file():
    try:
        data = request.json
        dataset_name = data['dataset_name']

        if dataset_name == 'pbmc3k':
            adata = sc.datasets.pbmc3k()
        elif dataset_name == 'pbmc3k_processed':
            adata = sc.datasets.pbmc3k_processed()
        elif dataset_name == 'pbmc68k_reduced':
            adata = sc.datasets.pbmc68k_reduced()
        elif dataset_name == 'moignard15':
            adata = sc.datasets.moignard15()
        elif dataset_name == 'krumsiek11':
            adata = sc.datasets.krumsiek11()
        elif dataset_name == 'paul15':
            adata = sc.datasets.paul15()

        h5ad_filename = str(dataset_name)+f"_{uuid.uuid4().hex}.h5ad"
        h5ad_filepath = os.path.join(app.config['UPLOAD_FOLDER'], h5ad_filename)
        adata.write(h5ad_filepath)
        return {'message': 'Datasets from scanpy installed successfully', 'filename': h5ad_filename}, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



#        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#        return jsonify(filename)
#    except Exception as e:
#        return jsonify({'error': str(e)}), 500
    


# Data status checking API
@app.route('/status', methods=['POST'])
def data_status():
    try:
        data = request.json
        filename = data['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)
        adata_desc_list = str(adata).split('\n    ')
        adata_desc = {}
        adata_desc['X'] = adata_desc_list[0]
        for item in adata_desc_list[1:]:
            key, value = item.split(': ')
            adata_desc[key] = value

        test = {}

        for key, value in adata_desc.items():
            valuelist = value[1:-1].split("', '")
            for eachvalue in valuelist:
                if key != 'X':
                    eachkey = key+"-"+eachvalue
                    test[eachkey] = {'adata_key':key, 'adata_subkey': eachvalue, 'dim': None, 'data_type': None}   
                    if key == 'obs':
                        if isinstance(adata.obs[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.obs[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.obs[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.obs[eachvalue].dtype)
                    if key == 'var':
                        if isinstance(adata.var[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.var[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.var[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.var[eachvalue].dtype)
                    if key == 'obsm':
                        if isinstance(adata.obsm[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.obsm[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.obsm[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.obsm[eachvalue].dtype)
                    if key == 'varm':
                        if isinstance(adata.varm[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.varm[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.varm[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.varm[eachvalue].dtype)
                    if key == 'uns':
                        if isinstance(adata.uns[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.uns[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.uns[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.uns[eachvalue].dtype)
                    if key == 'obsp':
                        if isinstance(adata.obsp[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.obsp[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.obsp[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.obsp[eachvalue].dtype)
                    if key == 'varp':
                        if isinstance(adata.varp[eachvalue], dict):
                            test[eachkey]['dim'] = len(adata.varp[eachvalue].values())
                            test[eachkey]['data_type'] = 'dict'
                        else:
                            test[eachkey]['dim'] = adata.varp[eachvalue].shape
                            test[eachkey]['data_type'] = str(adata.varp[eachvalue].dtype)


        

        return jsonify([adata_desc, test])
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Scanpy functions API
    
# Data Manipulation
## Get cell and gene ids    
@app.route('/get_ids', methods=['POST'])
def get_ids():
    try:
        data = request.json
        filename = data['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)
        cell_ids = adata.obs_names.tolist()
        gene_ids = adata.var_names.tolist()
        return jsonify({'cell_ids': cell_ids, 'gene_ids': gene_ids})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


## Add cell annotation to the adata
@app.route('/annotate', methods=['POST'])
def annotate():
    try:
        data = request.json
        filename = data['filename']
        annotation = data['annotation']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        adata.obs['annotation'] = annotation

        # Save the result as a new file
        new_filename = f"annotate_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

## inputting customized sc function to manipulate the adata
@app.route('/customize', methods=['POST'])



    
# Preprocessing
@app.route('/pp/filter', methods=['POST'])
def pp_filter():
    try:
        data = request.json
        filename = data['filename']
        filter_cells = data['filter_cells']
        filter_genes = data['filter_genes']
        make_var_name_unique = data['make_var_name_unique']
        #calculate_qc_metrics = data['calculate_qc_metrics']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        if make_var_name_unique:
            adata.var_names_make_unique()

        sc.pp.filter_cells(adata, min_genes=filter_cells)
        sc.pp.filter_genes(adata, min_cells=filter_genes)

        print('preprocessed', adata.shape)

        # Calculate the QC metrics
        #if calculate_qc_metrics:
        #    sc.pp.calculate_qc_metrics(adata, inplace=True)

        new_filename = f"filter_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/pp/qc', methods=['POST'])
def pp_qc():
    try:
        data = request.json
        filename = data['filename']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        # Calculate the QC metrics
        sc.pp.calculate_qc_metrics(adata, inplace=True)

        # Prepare the data for visualization
        # show in the Node's property
        cell_level_qcm = adata.obs_keys() # it's a list
        gene_level_qcm = adata.var_keys() # it's a list
        
        # Save the new file
        new_filename = f"qc_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        print('qc api called!')

        return jsonify({
            'newFilename': new_filename,
            'cell_level_qcm': cell_level_qcm,
            'gene_level_qcm': gene_level_qcm
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/highly_variable_genes', methods=['POST'])
def pp_highly_variable_genes():
    print(request.json)
    try:
        data = request.json
        filename = data['filename']
        n_top_genes = data['n_top_genes']
        flavor = data['flavor']
        min_mean = data['min_mean']
        max_mean = data['max_mean']
        min_disp = data['min_disp']
        max_disp = data['max_disp']
        span = data['span']
        n_bins = data['n_bins']
        inplace = data['inplace']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        # check if the data contains infinte values, may affect the bins calculation
        #df = pd.DataFrame(adata.X)
        # Replace positive and negative infinity with NaN
        #df.replace([np.inf, -np.inf], np.nan, inplace=True)
        # Optionally, drop rows with NaN values
        #df.dropna(inplace=True)

        # Update the data matrix in the AnnData object
        #adata.X = df.values
        sc.pp.highly_variable_genes(adata, n_top_genes=n_top_genes, flavor=flavor, min_mean=min_mean, max_mean=max_mean, min_disp=min_disp, max_disp=max_disp, span=span, n_bins=n_bins, inplace=inplace)

        # Save the result as a new file
        new_filename = f"highly_variable_genes_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/normalize_total', methods=['POST'])
def pp_normalize_total():
    try:
        data = request.json
        filename = data['filename']
        target_sum = data['target_sum']
        exclude_highly_expressed = data['exclude_highly_expressed']
        max_fraction = data['max_fraction']
        key_added = data['key_added']
        inplace = data['inplace']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.pp.normalize_total(adata, target_sum=target_sum, exclude_highly_expressed=exclude_highly_expressed, max_fraction=max_fraction, key_added=key_added, inplace=inplace)

        # Save the result as a new file
        new_filename = f"normalize_total_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/log1p', methods=['POST'])
def pp_log1p():
    try:
        data = request.json
        filename = data['filename']
        base = data['base']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.pp.log1p(adata, base=base)

        # Save the result as a new file
        new_filename = f"log1p_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/regress_out', methods=['POST'])
def pp_regress_out():
    try:
        data = request.json
        filename = data['filename']
        keys = data['keys']
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.pp.regress_out(adata, keys=keys)

        # Save the result as a new file
        new_filename = f"regress_out_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/scale', methods=['POST'])
def pp_scale():
    try:
        data = request.json
        filename = data['filename']
        zero_center = data['zero_center']
        max_value = data['max_value']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.pp.scale(adata, max_value=max_value, zero_center=zero_center)

        # Save the result as a new file
        new_filename = f"scale_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pp/neighbor', methods=['POST'])
def pp_neighbor():
    try:
        data = request.json
        filename = data['filename']
        n_neighbors = data['n_neighbors']
        n_pcs = data['n_pcs'] if isinstance(data['n_pcs'], int) else None
        knn = data['knn']
        random_state = data['random_state']
        method =  data['method']
        metric = data['metric']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.pp.neighbors(adata,  n_neighbors=n_neighbors, n_pcs=n_pcs, knn=knn, random_state=random_state, method=method, metric=metric)
        # 
        new_filename = f"neighbor_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


    
@app.route('/pp/vis/qc', methods=['POST'])
def pp_vis_qc():
    try:
        data = request.json
        filename = data['filename']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        # Prepare the data for visualizations
        # show in the Node's property
        cell_level_qcm = adata.obs_keys() # it's a list
        gene_level_qcm = adata.var_keys() # it's a list
        # use for Vis
        qcm_cell = adata.obs[adata.obs_keys()].T.to_dict(orient='index')
        qcm_gene = adata.var[adata.var_keys()].T.to_dict(orient='index')

        # Save the new file
        new_filename = f"qc_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        print('qc-vis api called!')

        return jsonify({
            'newFilename': new_filename,
            'cell_level_qcm': cell_level_qcm,
            'gene_level_qcm': gene_level_qcm,
            'qcm_cell': qcm_cell,
            'qcm_gene': qcm_gene
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Data Exploration
@app.route('/pp/vis/qc/highest_expr_genes', methods=['POST'])
def highest_expr_genes():
    data = request.json
    filename = data['filename']
    n_top = data['n_top']

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    adata = sc.read_h5ad(filepath)

    # Calculate the highest expressed genes
    sc.pp.calculate_qc_metrics(adata, inplace=True)
    highest_expr_genes = adata.var.sort_values('total_counts', ascending=False).index[:n_top]

    # Return the gene names and their counts
    gene_counts = adata[:, highest_expr_genes].X.sum(axis=0).tolist()[0]
    total_genes = adata[:, highest_expr_genes].X.toarray().T.tolist()
    return jsonify({ 'genes': highest_expr_genes.tolist(), 'counts': gene_counts, 'total_genes': total_genes})
    
#@app.route('/pp/filter_genes_dispersion', methods=['POST'])    
# function in scanpy was replaced by highly_variable_genes
@app.route('/pp/vis/qc/highly_variable_genes', methods=['POST'])


# Dimensionality Reduction 
@app.route('/tl/pca', methods=['POST'])
def pca():
    try:
        data = request.json
        filename = data['filename']
        n_components = data['n_components']
        zero_center = data['zero_center']
        svd_solver = data['svd_solver']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.pca(adata, n_comps=n_components, zero_center=zero_center, svd_solver=svd_solver)
        #print (adata.obsm['X_pca'].shape)
        # 
        new_filename = f"pca_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/vis/pca', methods=['POST'])
def pca_vis():
    try:
        filename = request.json['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)
        gene = request.json['gene']
    
    # Get the required data
        X_pca = adata.obsm['X_pca'].tolist()
        PCs = adata.varm['PCs'].tolist()
        variance_ratio = adata.uns['pca']['variance_ratio'].tolist()
        variance = adata.uns['pca']['variance'].tolist()
        gene_expression = adata[:, gene].X.toarray().T.tolist() if gene else []
        cell_ids = adata.obs_names.tolist()
        print (cell_ids)

        # Return the data as JSON
        return jsonify({
            'filename': filename,
            'X_pca': X_pca,
            'PCs': PCs,
            'variance_ratio': variance_ratio,
            'variance': variance,
            'gene_expression': gene_expression,
            'cell_ids': cell_ids
        })
    except Exception as e:
        return jsonify({'error': 'gene name '+str(e) + ' not exist'}), 500

@app.route('/tl/tsne', methods=['POST'])
def tsne():    
    try:
        data = request.json
        filename = data['filename']
        n_pcs = data['n_pcs'] if isinstance(data['n_pcs'], int) else None
        perplexity = data['perplexity']
        learning_rate = data['learning_rate']
        random_state = data['random_state']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.tsne(adata, n_pcs=n_pcs, perplexity=perplexity, learning_rate=learning_rate, random_state=random_state, early_exaggeration=12)
        # 
        new_filename = f"tsne_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/vis/tsne', methods=['POST'])

@app.route('/tl/umap', methods=['POST'])
def umap():
    try:
        data = request.json
        filename = data['filename']
        #min_dist = data['min_dist']
        #spread = data['spread']
        n_components = data['n_components']
        #alpha = data['alpha']
        #gamma = data['gamma']
        #negative_sample_rate = data['negative_sample_rate']
        init_pos = data['init_pos']
        random_state = data['random_state']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.umap(adata, min_dist=0.5, spread=1.0,n_components=n_components, init_pos=init_pos, random_state=random_state)
        # 
        new_filename = f"umap_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/tl/vis/umap', methods=['POST'])

@app.route('/tl/drawgraph', methods=['POST'])
def draw_graph():
    try:
        data = request.json
        filename = data['filename']
        layout = data['layout']
        init_pos = data['init_pos']
        random_state = data['random_state']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.draw_graph(adata, layout=layout, init_pos=init_pos, random_state=random_state)

        # Save the result as a new file
        new_filename = f"drawgraph_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tl/vis/draw_graph', methods=['POST'])

# Clustering
@app.route('/tl/leiden', methods=['POST'])
def leiden():
    try:
        data = request.json
        filename = data['filename']
        resolution = data['resolution']
        random_state = data['random_state']
        restrict_to = data['restrict_to']
        directed = data['directed']
        use_weights = data['use_weights']
        n_iterations = data['n_iterations']  

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.leiden(adata, resolution=resolution, random_state=random_state, restrict_to=restrict_to, directed=directed, use_weights=use_weights, n_iterations=n_iterations)

        # Save the result as a new file
        new_filename = f"leiden_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/louvain', methods=['POST'])
def louvain():
    try:
        data = request.json
        filename = data['filename']
        resolution = data['resolution']
        random_state = data['random_state']
        restrict_to = data['restrict_to']
        directed = data['directed']
        use_weights = data['use_weights']
        flavor = data['flavor'] 

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.louvain(adata, resolution=resolution, random_state=random_state, restrict_to=restrict_to, directed=directed, use_weights=use_weights, flavor=flavor)

        # Save the result as a new file
        new_filename = f"louvain_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500
    
@app.route('/tl/dendrogram', methods=['POST'])
def dendrogram():
    try:
        data = request.json
        filename = data['filename']
        group_by = data['group_by']
        n_pcs = data['n_pcs'] if isinstance(data['n_pcs'], int) else None
        cor_method = data['cor_method']
        linkage_method = data['linkage_method']
        optimal_ordering = data['optimal_ordering']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.dendrogram(adata, groupby=group_by , n_pcs=n_pcs, cor_method=cor_method, linkage_method=linkage_method, optimal_ordering=optimal_ordering)

        # Save the result as a new file
        new_filename = f"dendrogram_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Differential Expression
@app.route('/tl/rank_genes_groups', methods=['POST'])
def rank_genes_groups():
    try:
        data = request.json
        filename = data['filename']
        groupby = data['groupby']
        groups = data['groups']
        reference = data['reference']
        method = data['method']
        corr_method = data['corr_method']
        key_added = data['key_added']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.rank_genes_groups(adata, groupby=groupby, groups=groups, reference=reference, method=method, corr_method=corr_method, key_added=key_added)

        # Save the result as a new file
        new_filename = f"rank_genes_groups_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/filter_rank_genes_groups', methods=['POST'])
def filter_rank_genes_groups():
    try:
        data = request.json
        filename = data['filename']
        groupby = data['group_by']
        min_in_group_fraction = data['min_in_group_fraction']
        min_fold_change = data['min_fold_change']
        max_out_group_fraction = data['max_out_group_fraction']
        compare_abs = data['compare_abs']
        key_added = data['key_added']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.filter_rank_genes_groups(adata,groupby=groupby, min_in_group_fraction=min_in_group_fraction, min_fold_change=min_fold_change, max_out_group_fraction=max_out_group_fraction, compare_abs=compare_abs, key_added=key_added)

        # Save the result as a new file
        new_filename = f"filter_rank_genes_groups_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/marker_gene_overlap', methods=['POST']) #result is a matrix
def marker_gene_overlap():
    try:
        data = request.json
        filename = data['filename']
        reference_markers = data['marker_genes'] #should be a dict: Keys should be strings with the cell identity name and values are sets or lists of strings which match format of adata.var_name.
        key = data['key']
        method = data['method']
        normalize = data['normalize']
        top_n_markers = data['top_n_markers']
        adj_pval_threshold = data['adj_pval_threshold']
        key_added = data['key_added']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.marker_gene_overlap(adata, reference_markers, key=key, method=method, normalize=normalize, top_n_markers=top_n_markers, adj_pval_threshold=adj_pval_threshold, key_added=key_added)
        
        # Save the result as a new file
        new_filename = f"marker_gene_overlap_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#Others
@app.route('/tl/score_genes', methods=['POST'])
def score_genes():
    try:
        data = request.json
        filename = data['filename']
        gene_list = data['gene_list'].split(',')
        ctrl_size = data['ctrl_size']
        gene_pool = data['gene_pool']
        n_bins = data['n_bins']
        score_name = data['score_name']
        random_state = data['random_state']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.score_genes(adata, gene_list, ctrl_size=ctrl_size, gene_pool=gene_pool, n_bins=n_bins, score_name=score_name, random_state=random_state)

        # Save the result as a new file
        new_filename = f"score_genes_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/score_genes_cell_cycle', methods=['POST'])
def score_genes_cell_cycle():
    try:
        data = request.json
        filename = data['filename']
        s_genes = data['s_genes'].split(',')
        g2m_genes = data['g2m_genes'].split(',')

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.score_genes_cell_cycle(adata, s_genes=s_genes, g2m_genes=g2m_genes)

        # Save the result as a new file
        new_filename = f"score_genes_cell_cycle_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#Trajectory Inference
@app.route('/tl/diffmap', methods=['POST'])
def diffmap():
    try:
        data = request.json
        filename = data['filename']
        n_comps = data['n_comps']
        neighbors_key = data['neighbors_key']
        random_state = data['random_state']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.diffmap(adata, n_comps=n_comps, neighbors_key=neighbors_key, random_state=random_state)

        # Save the result as a new file
        new_filename = f"diffmap_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/paga', methods=['POST'])
def paga():
    try:
        data = request.json
        filename = data['filename']
        groups = data['groups']
        use_rna_velocity = data['use_rna_velocity']
        neighbors_key = data['neighbors_key']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.paga(adata, groups=groups, use_rna_velocity=use_rna_velocity, neighbors_key=neighbors_key)

        # Save the result as a new file
        new_filename = f"paga_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tl/dpt', methods=['POST'])
def dpt():
    try:
        data = request.json
        filename = data['filename']
        n_dcs = data['n_dcs']
        n_branchings = data['n_branchings']
        min_group_size = data['min_group_size']
        allow_kendall_tau_shift = data['allow_kendall_tau_shift']
        neighbors_key = data['neighbors_key']

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        sc.tl.dpt(adata, n_dcs=n_dcs, n_branchings=n_branchings, min_group_size=min_group_size, allow_kendall_tau_shift=allow_kendall_tau_shift, neighbors_key=neighbors_key)

        # Save the result as a new file
        new_filename = f"dpt_result_{uuid.uuid4().hex}.h5ad"
        new_filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        adata.write(new_filepath)

        return jsonify({'newFilename': new_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#############################################################################################################
# General Visualizations APIs：
## Scatter plot
@app.route('/vr/get_scatter', methods=['POST'])
def get_scatter():
    try:
        filename = request.json['filename']
        #print(filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)
        #print(adata)
        available_data =  [key for key in adata.obsm.keys() if key.startswith('X_')]
        available_color = [key for key in adata.obs.keys()]
        #print(available_data)
        #print(available_color)
        # Return the data as JSON 
        return jsonify({
            'filename': filename,
            'available_data': available_data,
            'available_color': available_color
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/vr/scatter', methods=['POST'])
def scatter():
    try:
        data = request.json
        filename = data['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath) 

    # Get the required data
        color = data['color']
        X_data =  data['data']
        data_returened = adata.obsm[X_data].tolist()
        color_retured = adata.obs[color].tolist()
        color_data_type = str(adata.obs[color].dtypes)
        cell_ids = adata.obs_names.tolist()
        #print (cell_ids)

        # Return the data as JSON
        return jsonify({
            'filename': filename,
            'data_retured': data_returened,
            'color_returned': color_retured,
            'color_data_type': color_data_type,
            'cell_ids': cell_ids
        })
    except Exception as e:
        return jsonify({'error': e}), 500

##Data Manipulation


## General Scatter based plots vis apis (scatter bubble scatter3d)
def generate_colormap_or_colorscale(data):
    colormap_name='viridis'
    colorscale= ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', 
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', 
            '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']
    # Check if the data is continuous or categorical
    is_continuous = np.issubdtype(data.dtype, np.number)

    if is_continuous:
        # Create a colormap for continuous data
        cmap = plt.get_cmap(colormap_name)

        # Normalize the data to 0-1
        data_normalized = (data - np.min(data)) / (np.max(data) - np.min(data))

        # Generate the colormap
        colormap = cmap(data_normalized)

        # Convert the colormap to hexadecimal colors
        colormap_hex = ["#%02x%02x%02x" % (int(r*255), int(g*255), int(b*255)) for r, g, b, _ in colormap]

        return colormap_hex
    else:
        # Create a colorscale for categorical data
        unique_categories = np.unique(data)
        colorscale_dict = {category: colorscale[i % len(colorscale)] for i, category in enumerate(unique_categories)}

        return colorscale_dict.values().tolist()
    
@app.route('/vr/get_data_scatter', methods=['POST'])
def get_data_scatter():
    print("get_data_scatter api called")
    #try:
    print(request.json)
    filename = request.json['filename']
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    adata = sc.read_h5ad(filepath)

    chart_type = request.json['chart']
    print(chart_type)
    
    query_x = request.json['x']
    query_y = request.json['y']
   
    query_color = request.json['color']
    query_label = request.json['label']

    if chart_type == 'scatter3d':
        query_z = request.json['z']
        query_size = request.json['size']
    
    if chart_type == 'bubble':
        query_size = request.json['size']

        # Create a dictionary with adata and sc
    namespace = {'adata': adata, 'sc': sc}

    # Execute the queries
    exec('column_x = ' + query_x, namespace)
    column_x = namespace['column_x'].tolist()
    exec('column_y = ' + query_y, namespace)
    column_y = namespace['column_y'].tolist()
    
    if chart_type == 'scatter3d':
        if query_z:
            exec('column_z = ' + query_z, namespace)
            column_z = namespace['column_z'].tolist()
        else:
            column_z = []
        if query_size:
            exec('column_size = ' + query_size, namespace)
            column_size = namespace['column_size'].tolist()
        else:
            column_size = []
    else:
        column_z = []
        column_size = []
    
    if chart_type == 'bubble':
        if query_size:
            exec('column_size = ' + query_size, namespace)
            column_size = namespace['column_size']
            # Normalize column_size to the range 1-10
            column_size = 10 + 20 * (column_size - np.min(column_size)) / (np.max(column_size) - np.min(column_size))
            column_size = column_size.tolist()
        else:
            column_size = []
    else:
        column_size = []

    if query_color:
        exec('column_color = ' + query_color, namespace)
        column_color = namespace['column_color']
        column_color_data_type = str(column_color.dtypes)
        column_color = column_color.tolist()
        #column_color = generate_colormap_or_colorscale(column_color).tolist()
    else:
        column_color = []
        column_color_data_type = ''
    
    print(column_color_data_type)

    if query_label:
        exec('column_label = ' + query_label, namespace)
        column_label = namespace['column_label'].tolist()       
    else:
        column_label = []
    #print("x: ", column_x)
    #print("y: ", column_y)
    #print("c: ", column_color)
    #print("l: ", column_label)

    # Return the data as JSON 
    return jsonify({
        'filename': filename,
        'column_x': column_x,
        'column_y': column_y,
        'column_z': column_z,
        'column_size': column_size,
        'column_color': column_color,
        'column_color_data_type': column_color_data_type,
        'column_label': column_label
    })
    #except Exception as e:
    #   return jsonify({'error': str(e)}), 500

##General get and return apis for vis recommender
@app.route('/vr/get_data', methods=['POST'])
def get_adata():
    print("get_adata api called")
    original_adata_obj_list = {'obs':[], 'var':[], 'obsm':[], 'varm':[], 'uns':[], 'obsp':[], 'varp':[]}
    try:
        filename = request.json['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        original_adata_obj_list['obs'] = [key for key in adata.obs.keys()]
        original_adata_obj_list['var'] = [key for key in adata.var.keys()]
        original_adata_obj_list['obsm'] = [key for key in adata.obsm.keys()]
        original_adata_obj_list['varm'] = [key for key in adata.varm.keys()]
        original_adata_obj_list['uns'] = [key for key in adata.uns.keys()]
        original_adata_obj_list['obsp'] = [key for key in adata.obsp.keys()]
        original_adata_obj_list['varp'] = [key for key in adata.varp.keys()]

        #print(original_adata_obj_list)
        # Return the data as JSON 
        return jsonify({
            'filename': filename,
            'adata_obj_list': original_adata_obj_list
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/vr/vis_data', methods=['POST'])
def vis_adata():
    try:
        data = request.json
        filename = data['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath) 

    # Get the required data
        attribute = data['attribute']
        subattribute =  data['subattribute']
        
        adataObject={'obs':adata.obs, 'var':adata.var, 'obsm':adata.obsm, 'varm':adata.varm, 'uns':adata.uns, 'obsp':adata.obsp, 'varp':adata.varp}
        data_returened = adataObject[attribute][subattribute]
        if isinstance(data_returened, pd.DataFrame):
            data_returened = data_returened.to_dict(orient='index')
        elif isinstance(data_returened, pd.Series):
            data_returened = data_returened.to_dict()
        elif isinstance(data_returened, np.ndarray):
            data_returened = data_returened.tolist()
        elif isinstance(data_returened, csr_matrix):
            data_returened = data_returened.toarray().tolist()
        else:
            data_returened = data_returened
                
        print (data_returened)

        # Return the data as JSON
        return jsonify({
            'filename': filename,
            'data_returned': data_returened,
        })
    except Exception as e:
        return jsonify({'error': e}), 500
#########SCANPY PLOT API###############
@app.route('/sc/pl/<vis_function_name>', methods=['POST'])
def sc_pl(vis_function_name):
    print(vis_function_name)
    print("sc.plot api called")
    print(request.json)
    try:
        data = request.json
        filename = data['filename']
        para = data['para']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        adata = sc.read_h5ad(filepath)

        if para:
            #parameters = ast.literal_eval(para)
            parameters = str_to_dict(para)
            #print(parameters)       
            vis_function = getattr(sc.pl, vis_function_name)
            vis_result = vis_function(adata, **parameters)
        else:
            vis_function = getattr(sc.pl, vis_function_name)
            vis_result = vis_function(adata)
        fig = plt.gcf()
        plugins.clear(fig)
        #plugins.connect(fig, plugins.Reset(), plugins.BoxZoom(), plugins.Zoom())
        
        json_vis_result = mpld3.fig_to_dict(fig)
        # Convert int32 values in json_vis_result
        json_vis_result = convert_int32(json_vis_result)

        json_vis_result = convert_float32(json_vis_result)

        #print(json_vis_result)

        return jsonify(json_vis_result)
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

###This function is used for convert int32 values in json_vis_result
def convert_int32(obj):
    if isinstance(obj, np.int32):
        return int(obj)
    elif isinstance(obj, list):
        return [convert_int32(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_int32(value) for key, value in obj.items()}
    else:
        return obj

def convert_float32(obj):
    if isinstance(obj, np.float32):
        return float(obj)
    elif isinstance(obj, list):
        return [convert_float32(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_float32(value) for key, value in obj.items()}
    else:
        return obj
###This is the end of the function
    
###Convert para string to para dict
def str_to_dict(para_str):
    # Remove unwanted characters
    para_str = para_str.replace('{', '').replace('}', '').replace('(', '').replace(')', '').replace('\'', '').replace('\"', '').replace(':', '=')
    
    para_list = para_str.split(',')
    para_dict = {}
    for item in para_list:
        key, value = item.split('=')
        value = value.strip()
        if value == 'None':
            para_dict[key.strip()] = None
        elif value.isdigit():
            para_dict[key.strip()] = int(value)
        elif '.' in value and value.replace('.', '', 1).isdigit():  # Improved check for float
            para_dict[key.strip()] = float(value)
        elif value.lower() == 'true':
            para_dict[key.strip()] = True
        elif value.lower() == 'false':
            para_dict[key.strip()] = False
        else:
            para_dict[key.strip()] = str(value)
    return para_dict
###This is the end of the function








#############################################################################################################
# load data
def load_data():
    genes = pd.read_csv('static/data/genes.tsv', header=None, sep='\t')
    barcodes = pd.read_csv('static/data/barcodes.tsv', header=None, sep='\t')
    matrix = scipy.io.mmread('static/data/matrix.mtx').T.tocsr()
    return genes, barcodes, matrix
'''
# preprocessing - abandon after discussion
def preprocess_data(min_genes, min_cells, n_pcs, n_neighbors, leiden_resolution):
    genes, barcodes, matrix = load_data()
    adata = sc.AnnData(matrix)
    adata.var_names = genes[0]
    adata.obs_names = barcodes[0]
    adata.var_names_make_unique()
    
    # 数据预处理
    sc.pp.filter_cells(adata, min_genes=min_genes)
    sc.pp.filter_genes(adata, min_cells=min_cells)
    sc.pp.normalize_total(adata, target_sum=1e4)
    sc.pp.log1p(adata)
    
    # 降维
    sc.tl.pca(adata, svd_solver='arpack')
    sc.pp.neighbors(adata, n_neighbors, n_pcs)
    sc.tl.umap(adata)
    sc.tl.leiden(adata, leiden_resolution)
    return adata
'''
#################### HTML RENDERING ####################
'''
@app.route('/')
def index():
    genes, barcodes, matrix = load_data()
    data_info = {
        'genes_shape': genes.shape,
        'barcodes_shape': barcodes.shape,
        'matrix_shape': matrix.shape,
        'non_zero': matrix.nnz
    }
    return render_template('index.html', data_info=data_info)
'''
@app.route('/')
def index():
    return render_template('visual-programming-page.html')


@app.route('/visual-programming-interface')
def visual_programming():
    return render_template('visual-programming-page.html')

@app.route('/output')
def output():
    return render_template('output.html')
'''
@app.route('/process', methods=['POST'])
def process_data():
    params = request.json
    min_genes = int(params.get('min_genes', 1000))
    min_cells = int(params.get('min_cells', 5))
    n_pcs = int(params.get('n_pcs', 40))
    n_neighbors = int(params.get('n_neighbors', 10))
    leiden_resolution = float(params.get('leiden_resolution', 0.5))
    
    adata = preprocess_data(min_genes, min_cells, n_pcs, n_neighbors, leiden_resolution)
    umap_result = adata.obsm['X_umap']
    clusters = adata.obs['leiden']
    cells = adata.obs.index
    result = {'umap': umap_result.tolist(), 'clusters': clusters.tolist(), 'cells': cells.tolist()}
    print(result)
    return jsonify(result)
'''

if __name__ == '__main__':
    app.run(debug=True)