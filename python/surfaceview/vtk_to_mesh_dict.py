import json
from vtk.util.numpy_support import vtk_to_numpy
from vtk import vtkUnstructuredGridReader, vtkXMLPolyDataReader
from vtk.numpy_interface import dataset_adapter as dsa

def vtk_to_mesh_dict(vtk_path: str, format: str) -> dict:
    if format == 'UnstructuredGrid':
        reader = vtkUnstructuredGridReader()
    elif format == 'XMLPolyData':
        reader = vtkXMLPolyDataReader()
    else:
        raise Exception(f'Unexpected format: {format}')
    reader.SetFileName(vtk_path)
    reader.Update()
    X = reader.GetOutput()
    Y = dsa.WrapDataObject(X)

    vertices0 = vtk_to_numpy(Y.Points) # 3 x n
    vertices = vertices0.tolist()
    if format == 'XMLPolyData':
        faces0 = vtk_to_numpy(Y.Polygons)
    else:
        faces0 = vtk_to_numpy(Y.Cells)
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
