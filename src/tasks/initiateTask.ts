import createObjectStorageClient from '../objectStorage/createObjectStorageClient'
import TaskManager from './TaskManager'

let objectStorageClient = null
const GOOGLE_BUCKET_NAME = process.env.REACT_APP_GOOGLE_BUCKET_NAME
if (GOOGLE_BUCKET_NAME) {
    objectStorageClient = createObjectStorageClient({google: {bucketName: GOOGLE_BUCKET_NAME}})
}
else {
    console.warn('Environment variable not set: REACT_APP_GOOGLE_BUCKET_NAME')
}


const taskManager = new TaskManager(objectStorageClient)

const initiateTask = (functionId: string, kwargs: {[key: string]: any}) => {
    return taskManager.initiateTask(functionId, kwargs)
}

export default initiateTask