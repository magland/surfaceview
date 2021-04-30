import axios from 'axios'
import deserializeReturnValue from './deserializeReturnValue'

class Task {
    #status: string = 'waiting'
    #errorMessage: string = ''
    #returnValue: any = null
    #onStatusChangedCallbacks: ((s: string) => void)[] = []
    constructor(private taskHash: string, private functionId: string, private kwargs: {[key: string]: any}) {
        ;(async () => {
            const url = `https://storage.googleapis.com/${process.env.REACT_APP_GOOGLE_BUCKET_NAME}/task_results/${taskHash}`
            let resp = null
            try {
                resp = await axios.get(url)
            }
            catch(err) {
            }
            if ((resp) && (resp.data)) {
                console.log('got result *', resp)
                const returnValue = deserializeReturnValue(resp.data.returnValueSerialized)
                console.log('got return value *', returnValue)
                this._setReturnValue(returnValue)
                this._setStatus('finished')
            }
            else {
                console.log('initiating task')
                await axios.post('/api/initiateTask', {task: {functionId, kwargs}, taskHash})
            }
        })()
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
    _setStatus(s: string) {
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