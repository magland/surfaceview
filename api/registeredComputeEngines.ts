import { VercelRequest, VercelResponse } from '@vercel/node'
import Ably from 'ably'
import {_validateObject, isString, sha1OfString, isOneOf, isEqualTo, optional, JSONValue, isObject, isJSONObject} from './common/misc'
import axios from 'axios'
import { rejects } from 'node:assert'

type RegisteredComputeEngine = {
    computeEngineConfigUri: string
    computeEngineConfig: any
}

const getMessageHistory = async (channel: Ably.Types.ChannelCallbacks) => {
    return new Promise<JSONValue[]>((resolve, reject) => {
        const ret: JSONValue[] = []
        const processPage = (page: Ably.Types.PaginatedResult<Ably.Types.Message>) => {
            try {
                for (let item of page.items) {
                    const msg = item.data
                    ret.push(msg)
                }
            }
            catch(e) {
                reject(e)
                return
            }
            if (page.hasNext()) {
                page.next((err, nextPage) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (nextPage) processPage(nextPage)
                })
            }
            else {
                resolve(ret)
            }
        }
        channel.history((err, resultPage) => {
            if (err) {
                reject(err)
                return
            }
            processPage(resultPage)
        })
    })
}

module.exports = (req: VercelRequest, res: VercelResponse) => {
    // Note that this uses Ably.Rest, not Realtime. This is because we don't want
    // to start a websocket connection to Ably just to make one publish, that
    // would be inefficient. Ably.Rest makes the publish as a REST request.
    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY })
    
    const registerChannel = ably.channels.get('register')
    getMessageHistory(registerChannel).then((messages) => {
        const unregisteredX: {[key: string]: boolean} = {}
        const X: {[key: string]: RegisteredComputeEngine} = {}
        for (let msg of messages) {
            if (isJSONObject(msg)) {
                if (msg.type === 'registerComputeEngine') {
                    const {computeEngineConfigUri, computeEngineConfig} = msg
                    if ((isString(computeEngineConfigUri)) && (isJSONObject(computeEngineConfig))) {
                        if ((!(computeEngineConfigUri in X)) && (!(computeEngineConfigUri in unregisteredX))) {
                            X[computeEngineConfigUri] = {
                                computeEngineConfigUri,
                                computeEngineConfig
                            }
                        }
                    }
                }
                else if (msg.type === 'unregisterComputeEngine') {
                    const {computeEngineConfigUri} = msg
                    if (isString(computeEngineConfigUri)) {
                        if (!(computeEngineConfigUri in X)) {
                            unregisteredX[computeEngineConfigUri] = true
                        }
                    }
                }
            }
        }
        const ret = Object.values(X)
        ret.sort((a, b) => ((a.computeEngineConfigUri < b.computeEngineConfigUri) ? -1 : (a.computeEngineConfigUri > b.computeEngineConfigUri) ? 1 : 0))
        res.json(ret)
    }).catch((error: Error) => {
        console.warn(error.message)
        res.status(404).send(`Error: ${error.message}`)
    })
}