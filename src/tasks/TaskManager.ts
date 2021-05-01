import crypto from 'crypto';
import Task from "./Task";
import Ably from 'ably'
import checkForTaskReturnValue from './checkForTaskReturnValue';
import { Sha1Hash } from '../common/misc';

class PubsubClient {
    #ablyClient
    constructor(private apiKey: string) {
        this.#ablyClient = new Ably.Realtime(apiKey);
    }
    getChannel(channelName: string) {
        return this.#ablyClient.channels.get(channelName)
    }
}

const ABLY_API_KEY_SUBSCRIBE = process.env.REACT_APP_ABLY_API_KEY_SUBSCRIBE || ''
if (!ABLY_API_KEY_SUBSCRIBE) {
    console.warn(`Environment variable not set: REACT_APP_ABLY_API_KEY_SUBSCRIBE`)
}

class TaskManager {
    #tasks: {[key: string]: Task} = {}
    constructor() {
        this._start()

        if (ABLY_API_KEY_SUBSCRIBE) {
            const pubsubClient = new PubsubClient(ABLY_API_KEY_SUBSCRIBE)
            const channel = pubsubClient.getChannel('task-status')
            channel.subscribe((x: any) => {
                const msg = JSON.parse(new TextDecoder().decode(x.data))
                if (msg.type === 'statusUpdate') {
                    const taskHash = msg.taskHash
                    if (taskHash in this.#tasks) {
                        const t = this.#tasks[taskHash]
                        if (msg.status === 'error') {
                            t._setErrorMessage(msg.error)
                            t._setStatus(msg.status)
                        }
                        else if (msg.status === 'finished') {
                            ;(async () => {
                                const returnValue = await checkForTaskReturnValue(taskHash, {deserialize: true})
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
        const taskData = {
            functionId,
            kwargs
        }
        const taskHash = sha1OfObject(taskData)
        if (taskHash.toString() in this.#tasks) {
            const tt = this.#tasks[taskHash.toString()]
            return tt
        }
        const t = new Task(taskHash, functionId, kwargs)
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