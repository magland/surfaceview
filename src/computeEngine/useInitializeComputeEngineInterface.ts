import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import createObjectStorageClient from '../objectStorage/createObjectStorageClient'
import createPubsubClient from '../pubsub/createPubsubClient'
import ComputeEngineClient from './ComputeEngineClient'
import {ComputeEngineInterface, RegisteredComputeEngine} from './ComputeEngineContext'

type Registration = {
    computeEngineConfig: {
        label: string
        objectStorageUrl: string
    },
    clientChannelName: string,
    serverChannelName: string,
    tokenDetails: {token: string}
}

const useSetupRegisteredComputeEngines = () => {
    const [registeredComputeEngines, setRegisteredComputeEngines] = useState<RegisteredComputeEngine[] | undefined>(undefined)

    const refreshRegisteredComputeEngines = useCallback(() => {
        ;(async () => {
            setRegisteredComputeEngines(undefined)
            const r = await axios.post('/api/registeredComputeEngines', {}, {responseType: 'json'})
            if (r.data) {
                setRegisteredComputeEngines(r.data)
            }
        })()
    }, [])

    useEffect(() => {
        refreshRegisteredComputeEngines()
    }, [refreshRegisteredComputeEngines])

    return {registeredComputeEngines, refreshRegisteredComputeEngines}
}

const useDefaultComputeEngine = () => {
    const uri = process.env.REACT_APP_DEFAULT_COMPUTE_ENGINE || ''
    const setDefaultComputeEngineConfigUri = useMemo(() => (() => {

    }), [])
    return {defaultComputeEngineConfigUri: uri, setDefaultComputeEngineConfigUri}
}

const useSetupComputeEngineInterface = (): ComputeEngineInterface => {
    const {defaultComputeEngineConfigUri} = useDefaultComputeEngine()
    const [computeEngineConfigUri, setComputeEngineConfigUri] = useState<string | undefined>(defaultComputeEngineConfigUri)
    const [registration, setRegistration] = useState<Registration | null | undefined>(undefined)
    const handleSetComputeEngineConfigUri = useCallback((uri: string) => {
        if (uri === computeEngineConfigUri) return
        setRegistration(undefined)
        setComputeEngineConfigUri(uri)
    }, [computeEngineConfigUri])
    useEffect(() => {
        if ((computeEngineConfigUri) && (registration === undefined)) {
            setRegistration(null)
            ;(async () => {
                const registration: Registration = (await axios.post('/api/register', {type: 'registerClient', computeEngineConfigUri})).data
                setRegistration(registration || null)
            })()
        }
    }, [computeEngineConfigUri, registration])
    const computeEngineClient = useMemo(() => {
        if (registration) {
            const objectStorageClient = createObjectStorageClient({http: {baseUrl: registration.computeEngineConfig.objectStorageUrl}})
            const ablyClient = createPubsubClient({ably: {token: registration.tokenDetails.token}})
            const clientChannel = ablyClient.getChannel(registration.clientChannelName)
            const serverChannel = ablyClient.getChannel(registration.serverChannelName)
            const X = new ComputeEngineClient(clientChannel, serverChannel, objectStorageClient)
            return X
        }
    }, [registration])
    const {registeredComputeEngines, refreshRegisteredComputeEngines} = useSetupRegisteredComputeEngines()
    return useMemo(() => ({
        registeredComputeEngines,
        computeEngineConfigUri,
        computeEngineConfig: registration ? registration.computeEngineConfig : undefined,
        computeEngineClient,
        setComputeEngineConfigUri: handleSetComputeEngineConfigUri,
        refreshRegisteredComputeEngines
    }), [computeEngineConfigUri, registration, computeEngineClient, handleSetComputeEngineConfigUri, registeredComputeEngines, refreshRegisteredComputeEngines])
}

export default useSetupComputeEngineInterface