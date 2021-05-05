import json
from .vtk_to_mesh_dict import vtk_to_mesh_dict

def vtk_to_mesh_json(vtk_path: str, npy_path: str, format: str, base64: bool=False):
    x = vtk_to_mesh_dict(vtk_path, format, base64=base64)
    with open(npy_path, 'w') as f:
        json.dump(x, f)