import axios from 'axios'
import { JSONValue, isFileKey, FeedId, _validateObject, isBoolean, optional, isOneOf, isObjectOf, isArrayOf, isString, nowTimestamp, elapsedSince, sleepMsec, isFeedId, JSONObject } from '../common/misc'
import { DurationMsec, isDurationMsec, isMessageCount, isSignedSubfeedMessage, isSubfeedHash, isSubfeedMessage, isSubfeedWatches, MessageCount, messageCountToNumber, SignedSubfeedMessage, SubfeedHash, SubfeedMessage, SubfeedPosition, subfeedPosition, subfeedPositionToNumber, SubfeedWatch, SubfeedWatches, unscaledDurationMsec } from './kacheryTypes'

class KacheryDaemonInterface {
    constructor(private opts: {apiPort: number, apiHost: string | undefined}) {

    }
    async getObjectData(name: string): Promise<ArrayBuffer | null> {
        const baseUrl = this._baseUrl()
        const url1 = `${baseUrl}/mutable/get`
        const key = {type: 'objectStorageFile', objectName: name}
        const resp1 = await axios.post(url1, {key}, {headers: this._authHeaders()})
        const responseData1: {
            success: boolean,
            found: boolean,
            value: JSONValue
        } = resp1.data
        if (!responseData1.found) return null
        const fileKey = responseData1.value
        if (!isFileKey(fileKey)) {
            console.warn(`Not a valid file key in getObjectData for ${name}`)
            return null
        }
        const url2 = `${baseUrl}/downloadFileData`
        const resp2 = await axios.post(url2, {fileKey}, {responseType: 'arraybuffer', headers: this._authHeaders()})
        return resp2.data || null
    }
    listenForMessages(opts: {feedId: FeedId, subfeedHash: SubfeedHash}, callback: (message: JSONObject) => void) {
        // todo: get subfeed position
        ;(async () => {
            const baseUrl = this._baseUrl()
            let position: SubfeedPosition | null = null
            while (position === null) {
                const timer = nowTimestamp()
                const url0 = `${baseUrl}/feed/getNumLocalMessages`
                const req0: FeedApiGetNumLocalMessagesRequest = {
                    feedId: opts.feedId,
                    subfeedHash: opts.subfeedHash
                }
                const resp0 = await axios.post(url0, req0, {headers: this._authHeaders()})
                const responseData0 = resp0.data
                if (isFeedApiGetNumLocalMessagesResponse(responseData0)) {
                    if (responseData0.success) {
                        position = subfeedPosition(messageCountToNumber(responseData0.numMessages))
                    }
                }
                else {
                    console.warn('Invalid getNumLocalMessages response', responseData0)
                }
                const elapsed = elapsedSince(timer)
                if (elapsed < 5000) {
                    await sleepMsec(5000 - elapsed)
                }
            }

            const url1 = `${baseUrl}/feed/watchForNewMessages`

            while (true) {
                const timer = nowTimestamp()
                const watch: SubfeedWatch = {
                    feedId: opts.feedId,
                    subfeedHash: opts.subfeedHash,
                    position
                }
                const request: FeedApiWatchForNewMessagesRequest = {
                    subfeedWatches: {
                        'watch': watch
                    },
                    waitMsec: unscaledDurationMsec(5000),
                    signed: false
                }
                const resp = await axios.post(url1, request, {headers: this._authHeaders()})
                const responseData = resp.data
                if (isFeedApiWatchForNewMessagesResponse(responseData)) {
                    const msgs = responseData.messages['watch']
                    if ((msgs) && (msgs.length > 0)) {
                        for (const msg of msgs) {
                            if (isSubfeedMessage(msg)) {
                                callback(msg)
                            }
                            else {
                                console.warn('Unexpected: not a subfeed message', msg)
                            }
                        }
                        position = subfeedPosition(subfeedPositionToNumber(position) + msgs.length)
                    }
                }
                else {
                    console.warn('Invalid watch for new messages response', responseData)
                }
                const elapsed = elapsedSince(timer)
                if (elapsed < 5000) {
                    await sleepMsec(5000 - elapsed)
                }
            }
        })()
    }
    async appendMessages(opts: {feedId: FeedId, subfeedHash: SubfeedHash, messages: JSONObject[]}) {
        const baseUrl = this._baseUrl()
        const url0 = `${baseUrl}/feed/appendMessages`
        const req0: FeedApiAppendMessagesRequest = {
            feedId: opts.feedId,
            subfeedHash: opts.subfeedHash,
            messages: opts.messages.map(m => (m as SubfeedMessage))
        }
        const resp0 = await axios.post(url0, req0, {headers: this._authHeaders()})
        const responseData0 = resp0.data
        if (isFeedApiAppendMessagesResponse(responseData0)) {
            if (!responseData0.success) {
                console.warn('Unexpected problem in /feed/appendMessages')    
            }
        }
        else {
            console.warn('Invalid appendMessages response', responseData0)
        }
    }
    _baseUrl() {
        const hostUrl = this.opts.apiHost || 'http://localhost'
        return `${hostUrl}:${this.opts.apiPort}`
    }
    _authHeaders() {
        return {
            "KACHERY-CLIENT-AUTH-CODE": 'test-code'
        }
    }
}

export interface FeedApiWatchForNewMessagesRequest {
    subfeedWatches: SubfeedWatches,
    waitMsec: DurationMsec,
    maxNumMessages?: MessageCount,
    signed?: boolean
}
export const isFeedApiWatchForNewMessagesRequest = (x: any): x is FeedApiWatchForNewMessagesRequest => {
    return _validateObject(x, {
        subfeedWatches: isSubfeedWatches,
        waitMsec: isDurationMsec,
        signed: optional(isBoolean),
        maxNumMessages: optional(isMessageCount)
    })
}
export interface FeedApiWatchForNewMessagesResponse {
    success: boolean,
    messages: {[key: string]: SubfeedMessage[]} | {[key: string]: SignedSubfeedMessage[]}
}
export const isFeedApiWatchForNewMessagesResponse = (x: any): x is FeedApiWatchForNewMessagesResponse => {
    return _validateObject(x, {
        success: isBoolean,
        messages: isOneOf([isObjectOf(isString, isArrayOf(isSubfeedMessage)), isObjectOf(isString, isArrayOf(isSignedSubfeedMessage))])
    })
}

export interface FeedApiGetNumLocalMessagesRequest {
    feedId: FeedId,
    subfeedHash: SubfeedHash
}
export const isFeedApiGetNumLocalMessagesRequest = (x: any): x is FeedApiGetNumLocalMessagesRequest => {
    return _validateObject(x, {
        feedId: isFeedId,
        subfeedHash: isSubfeedHash
    });
}
export interface FeedApiGetNumLocalMessagesResponse {
    success: boolean,
    numMessages: MessageCount
}
export const isFeedApiGetNumLocalMessagesResponse = (x: any): x is FeedApiGetNumLocalMessagesResponse => {
    return _validateObject(x, {
        success: isBoolean,
        numMessages: isMessageCount
    });
}

export interface FeedApiAppendMessagesRequest {
    feedId: FeedId,
    subfeedHash: SubfeedHash,
    messages: SubfeedMessage[]
}
export const isFeedApiAppendMessagesRequest = (x: any): x is FeedApiAppendMessagesRequest => {
    return _validateObject(x, {
        feedId: isFeedId,
        subfeedHash: isSubfeedHash,
        messages: isArrayOf(isSubfeedMessage)
    });
}
export interface FeedApiAppendMessagesResponse {
    success: boolean
}
export const isFeedApiAppendMessagesResponse = (x: any): x is FeedApiAppendMessagesResponse => {
    return _validateObject(x, {
        success: isBoolean
    });
}


export default KacheryDaemonInterface