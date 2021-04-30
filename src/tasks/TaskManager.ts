import crypto from 'crypto';
import Task from "./Task";
import Ably from 'ably'
import axios from 'axios';
import deserializeReturnValue from './deserializeReturnValue';

class TaskManager {
    #tasks: {[key: string]: Task} = {}
    constructor() {
        this._start()

        var ably = new Ably.Realtime(process.env.REACT_APP_ABLY_API_KEY_SUBSCRIBE as string);
        var channel = ably.channels.get('task-status')
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
                            const url = `https://storage.googleapis.com/${process.env.REACT_APP_GOOGLE_BUCKET_NAME}/task_results/${taskHash}`
                            const resp = await axios.get(url)
                            console.log('got result', resp)
                            const returnValue = deserializeReturnValue(resp.data.returnValueSerialized)
                            console.log('got return value', returnValue)
                            t._setReturnValue(returnValue)
                            t._setStatus(msg.status)
                        })()
                    }
                    else {
                        t._setStatus(msg.status)
                    }
                    
                }
            }
        })

    }
    initiateTask(functionId: string, kwargs: {[key: string]: any}) {
        const taskData = {
            functionId,
            kwargs
        }
        const taskHash = sha1OfObject(taskData)
        if (taskHash in this.#tasks) {
            const tt = this.#tasks[taskHash]
            return tt
        }
        const t = new Task(taskHash, functionId, kwargs)
        this.#tasks[taskHash] = t
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

export const sha1OfObject = (x: any): string => {
    return sha1OfString(JSONStringifyDeterministic(x))
}
export const sha1OfString = (x: string): string => {
    const sha1sum = crypto.createHash('sha1')
    sha1sum.update(x)
    return sha1sum.digest('hex')
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