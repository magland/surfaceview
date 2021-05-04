import React from 'react'
import ComputeEngineClient from './ComputeEngineClient'

export type ComputeEngineConfig = {
    label: string
    objectStorageUrl: string
}

export type ComputeEngineInterface = {
    computeEngineConfigUri?: string
    computeEngineConfig?: ComputeEngineConfig
    computeEngineClient?: ComputeEngineClient
    setComputeEngineConfigUri: (uri: string) => void
}

const dummyComputeEngineInterface = {
    setComputeEngineConfigUri: (uri: string) => {}
}

const ComputeEngineContext = React.createContext<ComputeEngineInterface>(dummyComputeEngineInterface)

export default ComputeEngineContext