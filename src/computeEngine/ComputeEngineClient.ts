import { FeedId } from "../common/misc";
import { SubfeedHash } from "../kacheryDaemonInterface/kacheryTypes";
import { ObjectStorageClient } from "../objectStorage/createObjectStorageClient";
import { PubsubChannel, PubsubMessage } from "../pubsub/createPubsubClient";
import SubfeedManager from "./SubfeedManager";
import TaskManager from "./tasks/TaskManager";

class ComputeEngineClient {
    #taskManager: TaskManager
    #subfeedManager: SubfeedManager
    constructor(private clientChannel: PubsubChannel, private serverChannel: PubsubChannel, private objectStorageClient: ObjectStorageClient) {
        this.#taskManager = new TaskManager(clientChannel, objectStorageClient)
        this.#subfeedManager = new SubfeedManager(clientChannel, objectStorageClient)
        serverChannel.subscribe((x: PubsubMessage) => {
            const msg = x.data
            this.#taskManager.processServerMessage(msg)
            this.#subfeedManager.processServerMessage(msg)
        })
    }
    initiateTask(functionId: string, kwargs: {[key: string]: any}) {
        return this.#taskManager.initiateTask(functionId, kwargs)
    }
    subscribeToSubfeed(opts: {feedId: FeedId, subfeedHash: SubfeedHash}) {
        const subfeedSubscription = this.#subfeedManager.createSubfeedSubscription(opts)
    }
}

export default ComputeEngineClient