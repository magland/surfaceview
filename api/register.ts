import { VercelRequest, VercelResponse } from '@vercel/node'
import Ably from 'ably'
import {_validateObject, isString, sha1OfString, isOneOf, isEqualTo, optional} from './common/misc'
import axios from 'axios'

type Request = {
    type: 'registerComputeEngine' | 'registerClient',
    computeEngineConfigUrl: string
    secret?: string
}
const isRequest = (x: any): x is Request => {
    return _validateObject(x, {
        type: isOneOf([isEqualTo('registerComputeEngine'), isEqualTo('registerClient')]),
        computeEngineConfigUrl: isString,
        secret: optional(isString)
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

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req
    if (!isRequest(request)) {
        res.status(400).send(`Invalid request: ${JSON.stringify(request)}`)
        return
    }

    ;(async () => {
        const { computeEngineConfigUrl, type, secret } = request
        const response = await axios.get(cacheBust(computeEngineConfigUrl), {responseType: 'json'})
        const computeEngineConfig = response.data

        if (request.type === 'registerComputeEngine') {
            const {secretSha1} = computeEngineConfig
            if (secretSha1 !== sha1OfString(secret)) {
                throw Error(`Invalid secret: ${secretSha1} <> ${sha1OfString(secret)}`)
            }
        }

        const configUrlHash = sha1OfString(computeEngineConfigUrl)

        // Note that this uses Ably.Rest, not Realtime. This is because we don't want
        // to start a websocket connection to Ably just to make one publish, that
        // would be inefficient. Ably.Rest makes the publish as a REST request.
        const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });

        const capability = {}
        const clientChannelName = 'client_' + configUrlHash.toString()
        if (type === 'registerComputeEngine') {
            capability[clientChannelName] = ["history", "subscribe"] // order matters i think
        }
        else if (type === 'registerClient') {
            capability[clientChannelName] = ["publish"] // order matters i think
        }

        const serverChannelName = 'server_' + configUrlHash.toString()
        if (type === 'registerComputeEngine') {
            capability[serverChannelName] = ["publish"] // order matters i think
        }
        else if (type === 'registerClient') {
            capability[serverChannelName] = ["history", "subscribe"] // order matters i think
        }

        const tokenDetails = await requestAblyToken({ablyRestClient: ably, capability})
        
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