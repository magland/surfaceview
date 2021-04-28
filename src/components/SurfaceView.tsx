import React, { useEffect, useState } from 'react'
import { FunctionComponent } from "react"

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow'
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor'
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData'
// import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';

const vtkColorMaps = require('vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps').default
const vtkOpenGLRenderWindow = require('vtk.js/Sources/Rendering/OpenGL/RenderWindow').default
const vtkInteractorStyleTrackballCamera = require('vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera').default
const {
    ColorMode,
    ScalarMode,
} = require('vtk.js/Sources/Rendering/Core/Mapper/Constants')

type Props = {
    surfaceData: {
        vertices: [number, number, number][]
        faces: number[]
    }
}

const SurfaceView: FunctionComponent<Props> = ({ surfaceData }) => {
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    console.log('--- ccc', container)

    useEffect(() => {
        if (!container) return
        setTimeout(() => {
            console.log('--- x1')
            const vertices = surfaceData.vertices
            const faces = surfaceData.faces

            let points_values = [];
            for (let i = 0; i < vertices.length; i++) {
                points_values.push(vertices[i][0])
                points_values.push(vertices[i][1])
                points_values.push(vertices[i][2])
            }

            console.log('--- x2')

            // The following is very helpful: https://kitware.github.io/vtk-js/docs/structures_PolyData.html
            let poly_init = {
                points: {
                    vtkClass: 'vtkPoints',
                    numberOfComponents: 3,
                    size: vertices.length,
                    dataType: 'Float32Array',
                    values: Float32Array.from(points_values)
                },
                polys: {
                    vtkClass: 'vtkCellArray',
                    dataType: 'Uint32Array',
                    values: Uint32Array.from(faces)
                }
            }

            console.log('--- x3')

            const renderWindow = vtkRenderWindow.newInstance();
            const renderer = vtkRenderer.newInstance(/*{ background: [0.2, 0.3, 0.4] }*/);
            renderWindow.addRenderer(renderer);

            console.log('--- x4')

                
            const polyData = vtkPolyData.newInstance(poly_init)
                
            const source = polyData;

            console.log('--- x5')

            // const lookupTable = vtkColorTransferFunction.newInstance();
            // const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');
            // lookupTable.applyColorMap(preset);
            // lookupTable.setVectorModeToMagnitude();
            const scalars = false
            const mapper = vtkMapper.newInstance({
                scalarVisibility: (scalars ? true : false),  // whether scalar data is used to color objects
                interpolateScalarsBeforeMapping: true, // not sure I understand this
                useLookupTableScalarRange: true, // whether the mapper sets the lookuptable range based on its own ScalarRange,
                // lookupTable, // used to map scalars into colors
                // colorByArrayName: (scalars ? 'scalars' : undefined), // the array name to do the coloring -- I think it's source.getPointData().getArray(colorByArrayName)
                // colorMode: ColorMode.MAP_SCALARS, // not sure I understand this. Affects how scalars are sent to the lookup table
                // scalarMode: ScalarMode.USE_POINT_FIELD_DATA // whether to use point data, cell data, or other
            });

            console.log('--- x6')
                

            mapper.setInputData(source);
            const actor = vtkActor.newInstance();
            actor.setMapper(mapper);

            renderer.addActor(actor);
            
            renderer.resetCamera();

            const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
            renderWindow.addView(openglRenderWindow);

            console.log('--- x7')

            // ----------------------------------------------------------------------------
            // Setup an interactor to handle mouse events
            // ----------------------------------------------------------------------------

            const interactor = vtkRenderWindowInteractor.newInstance();
            console.log('--- x7.1')
            interactor.setView(openglRenderWindow);
            console.log('--- x7.2')
            interactor.initialize();

            console.log('--- x8')

            // ----------------------------------------------------------------------------
            // Setup interactor style to use
            // ----------------------------------------------------------------------------

            interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

            // setInteractor(interactor)

            // how do we ensure this is only done once???
            interactor.bindEvents(container);
            console.log('--- setting container', container)
            openglRenderWindow.setContainer(container);

            const width = 500
            const height = 500
                
            openglRenderWindow.setSize(width, height);
            interactor.setView(openglRenderWindow);
            interactor.initialize();

            console.log('--- x10')
        }, 1000)
    }, [surfaceData, container])

    return <div style={{position: 'relative', width: 500, height: 500}} ref={setContainer} />
}

export default SurfaceView