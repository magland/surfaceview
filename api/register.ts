import { VercelRequest, VercelResponse } from '@vercel/node'
import Ably from 'ably'
import {_validateObject, isString, sha1OfString, isOneOf, isEqualTo, optional, isBoolean} from './common/misc'
import axios from 'axios'

type Request = {
    type: 'registerComputeEngine' | 'registerClient',
    computeEngineConfigUri: string
    secret?: string
    reportOnly?: string
    unregister?: string
}
const isRequest = (x: any): x is Request => {
    return _validateObject(x, {
        type: isOneOf([isEqualTo('registerComputeEngine'), isEqualTo('registerClient')]),
        computeEngineConfigUri: isString,
        secret: optional(isString),
        reportOnly: optional(isBoolean),
        unregister: optional(isBoolean)
    })
}

const requestAblyToken = async (opts: {ablyRestClient: Ably.Rest, capability: any}) => {
    return new Promise<Ably.Types.TokenDetails>((resolve, reject) => {
        opts.ablyRestClient.auth.requestToken({
            capability: JSON.stringify(opts.capability)
        }, (err, result) => {
            if (err) {
                reject(err)
                return
            }
            if (!result) throw Error('Unexpected')
            resolve(result)
        })
    })
}

const cacheBust = (url: string) => {
    if (url.includes('?')) {
        return url + `&cb=${randomAlphaString(10)}`
    }
    else {
        return url + `?cb=${randomAlphaString(10)}`
    }
}

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

const urlFromUri = (uri: string) => {
    if (uri.startsWith('gs://')) {
        const p = uri.slice("gs://".length)
        return `https://storage.googleapis.com/${p}`
    }
    else return uri
}

const publishMessageAsync = async (channel: Ably.Types.ChannelCallbacks, message: any) => {
    return new Promise<void>((resolve, reject) => {
        channel.publish({
            data: message
        }, (err: Error) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    })
}

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req
    if (!isRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    ;(async () => {
        const { computeEngineConfigUri, type, secret, reportOnly, unregister } = request
        const url0 = urlFromUri(computeEngineConfigUri)
        const response = await axios.get(cacheBust(url0), {responseType: 'json'})
        const computeEngineConfig: {label: string, objectStorageUrl: string, secretSha1: string} = response.data

        if (request.type === 'registerComputeEngine') {
            const {secretSha1} = computeEngineConfig
            if (secretSha1 !== sha1OfString(secret).toString()) {
                throw Error(`Invalid secret: ${secretSha1} <> ${sha1OfString(secret)}`)
            }
        }

        const configUriHash = sha1OfString(computeEngineConfigUri)

        // Note that this uses Ably.Rest, not Realtime. This is because we don't want
        // to start a websocket connection to Ably just to make one publish, that
        // would be inefficient. Ably.Rest makes the publish as a REST request.
        const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });

        let tokenDetails: any | null
        const clientChannelName = 'client_' + configUriHash.toString()
        const serverChannelName = 'server_' + configUriHash.toString()
        if (!reportOnly) {
            const capability: {[key: string]: string[]} = {}
            
            if (type === 'registerComputeEngine') {
                capability[clientChannelName] = ["history", "subscribe"] // order matters i think
            }
            else if (type === 'registerClient') {
                capability[clientChannelName] = ["publish"] // order matters i think
            }

            if (type === 'registerComputeEngine') {
                capability[serverChannelName] = ["publish"] // order matters i think
            }
            else if (type === 'registerClient') {
                capability[serverChannelName] = ["history", "subscribe"] // order matters i think
                capability['register'] = ["history", "subscribe"] // order matters i think
            }

            tokenDetails = await requestAblyToken({ablyRestClient: ably, capability})
        }
        else {
            tokenDetails = null
        }

        if (type === 'registerComputeEngine') {
            const registerChannel = ably.channels.get('register')
            // important to await because serverless may end before data is sent
            await publishMessageAsync(registerChannel, {
                type: unregister ? 'unregisterComputeEngine' : 'registerComputeEngine',
                computeEngineConfigUri,
                computeEngineConfig
            })
        }
        
        return {
            computeEngineConfig,
            clientChannelName,
            serverChannelName,
            tokenDetails
        }
    })().then((result) => {
        res.json(result)
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(404).send(`Error: ${error.message}`)
    })
}