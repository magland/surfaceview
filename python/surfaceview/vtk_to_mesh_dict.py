import json
from vtk.util.numpy_support import vtk_to_numpy
from vtk import vtkUnstructuredGridReader
from vtk.numpy_interface import dataset_adapter as dsa

def vtk_to_mesh_dict(vtk_path: str) -> dict:
    reader = vtkUnstructuredGridReader()
    reader.SetFileName(vtk_path)
    reader.Update()
    X = reader.GetOutput()
    Y = dsa.WrapDataObject(X)

    vertices0 = vtk_to_numpy(Y.Points) # 3 x n
    faces0 = vtk_to_numpy(Y.Cells)
    vertices = vertices0.tolist()
    ifaces = []
    faces = []
    i = 0
    while i < len(faces0):
        num_points = faces0[i]
        i = i + 1
        ifaces.append(len(faces) + 1)
        for j in range(num_points):
            faces.append(int(faces0[i]))
            i = i + 1

    return {
        'vertices': vertices,
        'ifaces': ifaces,
        'faces': faces
    }
