import axios from 'axios'
import { Sha1Hash } from '../common/misc'
import checkForTaskReturnValue from './checkForTaskReturnValue'

export type TaskStatus = 'waiting' | 'pending' | 'queued' | 'running' | 'finished' | 'error'

class Task {
    #status: TaskStatus = 'waiting'
    #errorMessage: string = ''
    #returnValue: any = null
    #onStatusChangedCallbacks: ((s: string) => void)[] = []
    constructor(private taskHash: Sha1Hash, private functionId: string, private kwargs: {[key: string]: any}) {
        ;(async () => {
            const returnValue = await checkForTaskReturnValue(taskHash, {deserialize: true})
            if (returnValue) {
                this._setReturnValue(returnValue)
                this._setStatus('finished')
            }
            else {
                console.log('initiating task')
                await axios.post('/api/initiateTask', {task: {functionId, kwargs}, taskHash})
            }
        })()
        const timeoutForNoResponse = 10000
        setTimeout(() => {
            if (this.#status === 'waiting') {
                this._setErrorMessage('Timeout while waiting for response from compute resource')
                this._setStatus('error')
            }
        }, timeoutForNoResponse)
    }
    public get status() {
        return this.#status
    }
    public get returnValue() {
        return this.#returnValue
    }
    public get errorMessage() {
        return this.#errorMessage
    }
    onStatusChanged(cb: (s: string) => void) {
        this.#onStatusChangedCallbacks.push(cb)
    }
    _setStatus(s: TaskStatus) {
        if (this.#status === s) return
        this.#status = s
        for (let cb of this.#onStatusChangedCallbacks) cb(this.#status)
    }
    _setReturnValue(x: any) {
        this.#returnValue = x
    }
    _setErrorMessage(e: string) {
        this.#errorMessage = e
    }
}

export default Task