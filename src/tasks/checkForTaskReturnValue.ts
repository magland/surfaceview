import axios from "axios"
import { Sha1Hash } from "../common/misc"
import deserializeReturnValue from "./deserializeReturnValue"

const GOOGLE_BUCKET_NAME = process.env.REACT_APP_GOOGLE_BUCKET_NAME
if (!GOOGLE_BUCKET_NAME) {
    console.warn('Environment variable not set: REACT_APP_GOOGLE_BUCKET_NAME')
}

const pathifyHash = (x: Sha1Hash) => {
    return `${x[0]}${x[1]}/${x[2]}${x[3]}/${x[4]}${x[5]}/${x}`
}

const checkForTaskReturnValue = async (taskHash: Sha1Hash, opts: {deserialize: boolean}): Promise<any | null> => {
    const {deserialize} = opts
    const url = `https://storage.googleapis.com/${GOOGLE_BUCKET_NAME}/task_results/${pathifyHash(taskHash)}`
    let resp = null
    try {
        resp = await axios.get(url)
    }
    catch(err) {
        return null
    }
    if ((resp) && (resp.data)) {
        let returnValue = resp.data
        if (deserialize) {
            try {
                returnValue = deserializeReturnValue(returnValue)
            }
            catch(err) {
                console.warn(`Problem deserializing return value for: ${url}`)
                return false
            }
        }
        return returnValue
    }
    else return null
}

export default checkForTaskReturnValue