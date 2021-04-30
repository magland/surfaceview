import TaskManager from './TaskManager'

const taskManager = new TaskManager()

const initiateTask = (functionId: string, kwargs: {[key: string]: any}) => {
    return taskManager.initiateTask(functionId, kwargs)
}

export default initiateTask