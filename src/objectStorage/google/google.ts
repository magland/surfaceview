import axios from "axios"

export type GoogleObjectStorageClientOpts = {
    bucketName: string
}

class GoogleObjectStorageClient {
    constructor(private opts: GoogleObjectStorageClientOpts) {
    }
    async getObjectData(name: string) {
        const url = `https://storage.googleapis.com/${this.opts.bucketName}/${name}`
        let resp = null
        try {
            resp = await axios.get(url)
        }
        catch(err) {
            return null
        }
        if ((resp) && (resp.data)) {
            return resp.data
        }
        else return null
    }
}

export default GoogleObjectStorageClient