import GoogleObjectStorageClient, { GoogleObjectStorageClientOpts } from "./google/google"

export interface ObjectStorageClient {
    getObjectData: (name: string) => Promise<any | null>
}

const createObjectStorageClient = (opts: {google: GoogleObjectStorageClientOpts}): ObjectStorageClient => {
    if (opts.google) {
        return new GoogleObjectStorageClient(opts.google)
    }
    else {
        throw Error('Invalid opts in createObjectStorageClient')
    }
}

export default createObjectStorageClient