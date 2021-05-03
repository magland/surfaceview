import Ably from 'ably'
import { PubsubMessage } from '../createPubsubClient'

class AblyPubsubChannel {
    #ablyChannel
    constructor(private ablyClient: Ably.Realtime, private channelName: string, private opts: {subscribeOnly: boolean}) {
        this.#ablyChannel = ablyClient.channels.get(channelName)
    }
    subscribe(callback: (message: PubsubMessage) => void) {
        this.#ablyChannel.subscribe((x: any) => {
            const data0 = JSON.parse(new TextDecoder().decode(x.data))
            callback({
                data: data0
            })
        })
    }
}

export type AblyPubsubClientOpts = {
    apiKey: string
    subscribeOnly: boolean
}

class AblyPubsubClient {
    #ablyClient
    constructor(private opts: AblyPubsubClientOpts) {
        this.#ablyClient = new Ably.Realtime(opts.apiKey);
    }
    getChannel(channelName: string) {
        return new AblyPubsubChannel(this.#ablyClient, channelName, {subscribeOnly: this.opts.subscribeOnly})
    }
}

export default AblyPubsubClient