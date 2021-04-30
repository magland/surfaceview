import { VercelRequest, VercelResponse } from '@vercel/node'
import Ably from 'ably'
import {inspect} from 'util'
import {JSONObject, _validateObject, isString, isJSONObject, Sha1Hash, isSha1Hash, sha1OfObject} from './common/misc'

type Task = {
    functionId: string
    kwargs: JSONObject
}
const isTask = (x: any): x is Task => {
    return _validateObject(x, {
        functionId: isString,
        kwargs: isJSONObject
    })
}

type Request = {
    taskHash: Sha1Hash
    task: Task
}
const isRequest = (x: any): x is Request => {
    return _validateObject(x, {
        taskHash: isSha1Hash,
        task: isTask
    })
}

module.exports = (req: VercelRequest, res: VercelResponse) => {
    const {body: request} = req
    if (!isRequest(request)) throw Error(`Invalid request: ${JSON.stringify(request)}`)
    if (sha1OfObject(request.task) !== (request.taskHash)) throw Error(`Incorrect task hash`)

    // Note that this uses Ably.Rest, not Realtime. This is because we don't want
    // to start a websocket connection to Ably just to make one publish, that
    // would be inefficient. Ably.Rest makes the publish as a REST request.
    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });

    // Now get an Ably channel and publish something on it. Make sure you don't 
    // publish to a channel that has this reactor rule on it, or you'll get an infinite loop!
    const channel = ably.channels.get('task-queue');
    channel.publish('initiateTask', {'type': 'initiateTask', 'task': request.task, 'taskHash': request.taskHash}, (err) => {
        if (err) {
            console.log("Error publishing back to ably:", inspect(err));
            res.json({
                test: `error: ${err}`
            })
        } else {
            // Make sure to only call the callback (ending execution) in the callback of
            // the publish(), or the function will stop executing before it has a chance to
            // make the http request
            res.json({
                test: 'okay!'
            })
        }
    });
}