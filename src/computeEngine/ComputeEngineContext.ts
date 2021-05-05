import React from 'react'
import ComputeEngineClient from './ComputeEngineClient'

export type ComputeEngineConfig = {
    label: string
    objectStorageUrl: string
}

export type RegisteredComputeEngine = {
    computeEngineConfigUri: string
    computeEngineConfig: any
}

export type ComputeEngineInterface = {
    registeredComputeEngines?: RegisteredComputeEngine[]
    computeEngineConfigUri?: string
    computeEngineConfig?: ComputeEngineConfig
    computeEngineClient?: ComputeEngineClient
    refreshRegisteredComputeEngines: () => void
    setComputeEngineConfigUri: (uri: string) => void
}

const dummyComputeEngineInterface = {
    refreshRegisteredComputeEngines: () => {},
    setComputeEngineConfigUri: (uri: string) => {}
}

const ComputeEngineContext = React.createContext<ComputeEngineInterface>(dummyComputeEngineInterface)

export default ComputeEngineContext