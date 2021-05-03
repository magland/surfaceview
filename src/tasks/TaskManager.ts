import crypto from 'crypto';
import Task, { TaskStatus, isTaskStatus } from "./Task";
import checkForTaskReturnValue from './checkForTaskReturnValue';
import { isEqualTo, isSha1Hash, isString, optional, Sha1Hash, _validateObject } from '../common/misc';
import { PubsubMessage } from '../pubsub/createPubsubClient';
import createPubsubClient from '../pubsub/createPubsubClient';
import { ObjectStorageClient } from '../objectStorage/createObjectStorageClient';

type StatusUpdateMessage = {
    type: 'statusUpdate'
    taskHash: Sha1Hash
    status: TaskStatus
    error?: string
}
const isStatusUpdateMessage = (x: any): x is StatusUpdateMessage => {
    return _validateObject(x, {
        type: isEqualTo('statusUpdate'),
        taskHash: isSha1Hash,
        status: isTaskStatus,
        error: optional(isString)
    })
}

class TaskManager {
    #tasks: {[key: string]: Task} = {}
    constructor(private objectStorageClient: ObjectStorageClient | null) {
        this._start()
        
        const ABLY_API_KEY_SUBSCRIBE = process.env.REACT_APP_ABLY_API_KEY_SUBSCRIBE || ''
        if (!ABLY_API_KEY_SUBSCRIBE) {
            console.warn(`Environment variable not set: REACT_APP_ABLY_API_KEY_SUBSCRIBE`)
        }

        if (ABLY_API_KEY_SUBSCRIBE) {
            const pubsubClient = createPubsubClient({ably: {apiKey: ABLY_API_KEY_SUBSCRIBE, subscribeOnly: true}})
            const channel = pubsubClient.getChannel('task-status')
            channel.subscribe((x: PubsubMessage) => {
                const msg = x.data
                if (isStatusUpdateMessage(msg)) {
                    const taskHash = msg.taskHash
                    if ((isSha1Hash(taskHash)) && (taskHash.toString() in this.#tasks)) {
                        const t = this.#tasks[taskHash.toString()]
                        if (msg.status === 'error') {
                            t._setErrorMessage(msg.error || 'unknown')
                            t._setStatus(msg.status)
                        }
                        else if (msg.status === 'finished') {
                            ;(async () => {
                                if (!objectStorageClient) return
                                const returnValue = await checkForTaskReturnValue(objectStorageClient, taskHash, {deserialize: true})
                                if (returnValue) {
                                    t._setReturnValue(returnValue)
                                    t._setStatus(msg.status)
                                }
                                else {
                                    t._setErrorMessage('Problem getting return value for task')
                                    t._setStatus('error')
                                }
                            })()
                        }
                        else {
                            t._setStatus(msg.status)
                        }
                    }
                }
            })
        }
    }
    initiateTask(functionId: string, kwargs: {[key: string]: any}) {
        if (!this.objectStorageClient) {
            console.warn('Unable to initiate task. No object storage client.')
            return undefined
        }
        const taskData = {
            functionId,
            kwargs
        }
        const taskHash = sha1OfObject(taskData)
        if (taskHash.toString() in this.#tasks) {
            const tt = this.#tasks[taskHash.toString()]
            return tt
        }
        const t = new Task(this.objectStorageClient, taskHash, functionId, kwargs)
        this.#tasks[taskHash.toString()] = t
        return t
    }
    async _start() {
        const taskHashes = Object.keys(this.#tasks)
        for (let taskHash of taskHashes) {
            const t = this.#tasks[taskHash]
            if (['error', 'finished'].includes(t.status)) {
                delete this.#tasks[taskHash]
            }
        }
        await sleepMsec(5000)
    }
}

export const sha1OfObject = (x: any): Sha1Hash => {
    return sha1OfString(JSONStringifyDeterministic(x))
}
export const sha1OfString = (x: string): Sha1Hash => {
    const sha1sum = crypto.createHash('sha1')
    sha1sum.update(x)
    return sha1sum.digest('hex') as any as Sha1Hash
}
// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = ( obj: Object, space: string | number | undefined =undefined ) => {
    var allKeys: string[] = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}

const sleepMsec = (m: number) => new Promise(r => setTimeout(r, m));

export default TaskManager