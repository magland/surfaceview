import { Sha1Hash } from "../common/misc"
import { ObjectStorageClient } from "../objectStorage/createObjectStorageClient"
import deserializeReturnValue from "./deserializeReturnValue"

const pathifyHash = (x: Sha1Hash) => {
    return `${x[0]}${x[1]}/${x[2]}${x[3]}/${x[4]}${x[5]}/${x}`
}

const checkForTaskReturnValue = async (objectStorageClient: ObjectStorageClient, taskHash: Sha1Hash, opts: {deserialize: boolean}): Promise<any | null> => {
    const path = `task_results/${pathifyHash(taskHash)}`
    let returnValue = objectStorageClient.getObjectData(path)
    if (!returnValue) return null
    if (opts.deserialize) {
        try {
            returnValue = deserializeReturnValue(returnValue)
        }
        catch(err) {
            console.warn(`Problem deserializing return value for: ${path}`)
            return false
        }
    }
    return returnValue
}

export default checkForTaskReturnValue