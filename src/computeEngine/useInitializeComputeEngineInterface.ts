import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import createObjectStorageClient from '../objectStorage/createObjectStorageClient'
import createPubsubClient from '../pubsub/createPubsubClient'
import ComputeEngineClient from './ComputeEngineClient'
import {ComputeEngineInterface} from './ComputeEngineContext'

type Registration = {
    computeEngineConfig: {
        label: string
        objectStorageUrl: string
    },
    clientChannelName: string,
    serverChannelName: string,
    tokenDetails: {token: string}
}

const useSetupComputeEngineInterface = (): ComputeEngineInterface => {
    const [computeEngineConfigUri, setComputeEngineConfigUri] = useState<string | undefined>(undefined)
    const [registration, setRegistration] = useState<Registration | null | undefined>(undefined)
    const handleSetComputeResourceConfigUri = useCallback((uri: string) => {
        if (uri === computeEngineConfigUri) return
        setRegistration(undefined)
        setComputeEngineConfigUri(uri)
    }, [computeEngineConfigUri])
    useEffect(() => {
        console.log('---- a', computeEngineConfigUri, registration)
        if ((computeEngineConfigUri) && (registration === undefined)) {
            setRegistration(null)
            ;(async () => {
                const computeEngineConfigUrl = urlFromUri(computeEngineConfigUri)
                const registration: Registration = (await axios.post('/api/register', {type: 'registerClient', computeEngineConfigUrl})).data
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
    return useMemo(() => ({
        computeEngineConfigUri,
        computeEngineConfig: registration ? registration.computeEngineConfig : undefined,
        computeEngineClient,
        setComputeEngineConfigUri: handleSetComputeResourceConfigUri
    }), [computeEngineConfigUri, registration, computeEngineClient, handleSetComputeResourceConfigUri])
    
}

const urlFromUri = (uri: string) => {
    if (uri.startsWith('gs://')) {
        const p = uri.slice("gs://".length)
        return `https://storage.googleapis.com/${p}`
    }
    else return uri
}

export default useSetupComputeEngineInterface