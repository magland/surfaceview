import React, { useEffect, useMemo, useState } from 'react'
import { FunctionComponent } from "react"
import {useLocation, useHistory} from 'react-router-dom'
import Task, { TaskStatus } from '../../computeEngine/tasks/Task'
import useComputeEngineClient, { useComputeEngineInterface } from '../../computeEngine/useComputeEngineClient'
import useSurfaceUri from '../MainWindow/useSurfaceUri'
import SurfaceView, { SurfaceData } from '../SurfaceView/SurfaceView'

type Props = {
    
}

const useTask = (functionId: string, kwargs: any) => {
    const computeEngineClient = useComputeEngineClient()
    const [taskStatus, setTaskStatus] = useState<TaskStatus>('waiting')
    const task = useMemo(() => {
        if (!computeEngineClient) return undefined
        return computeEngineClient.initiateTask(functionId, kwargs)
    }, [functionId, kwargs, computeEngineClient])
    useEffect(() => {
        if (!task) return
        task.onStatusChanged((s) => {
            setTaskStatus(task.status)
        })
    }, [task])

    const returnValue = task ? (
        (taskStatus === 'finished') && (task.status === 'finished') ? (
            task.returnValue
        ) : undefined
    ) : undefined

    return {returnValue, task}
}

const useSurfaceDataFromUri = (uri: string) => {
    const {returnValue: surfaceData, task} = useTask('load_surface', {uri})
    return surfaceData ? surfaceData as SurfaceData : undefined
}

const MainView: FunctionComponent<Props> = () => {
    const {surfaceUri} = useSurfaceUri()
    const surfaceData = useSurfaceDataFromUri(surfaceUri)
    return ( 
        <div>
            {
                surfaceData && (
                    <SurfaceView
                        surfaceData={surfaceData}
                    />
                )
            }
        </div>
    )
}

export default MainView