import { JSONValue } from "../common/misc"
import AblyPubsubClient, {AblyPubsubClientOpts} from "./ably/AblyPubsubClient"

export interface PubsubMessage {
    data: JSONValue
}

export interface PubsubChannel {
    subscribe: (callback: (message: PubsubMessage) => void) => void
}

export interface PubsubClient {
    getChannel: (channelName: string) => PubsubChannel
}

const createPubsubClient = (opts: {ably: AblyPubsubClientOpts}): PubsubClient => {
    if (opts.ably) {
        return new AblyPubsubClient(opts.ably)
    }
    else {
        throw Error('Invalid opts in createPubsubClient')
    }
}


export default createPubsubClient