import { useEffect, useState } from "react"
import GoogleUserStorageClient, { GoogleUserStorageClientOpts } from "./google/GoogleUserStorageClient"

export interface UserStorageFile {
    id: string,
    mimeType: string,
    name: string
    downloadContent: () => Promise<any>
}

export interface UserStorageClient {
    listFiles: (folderName: string, updateCode: number) => Promise<UserStorageFile[] | undefined>
    onSignedInChanged: (callback: (val: boolean) => void) => void
    signInButton(): any
    uploadFileComponent(props: {folderName: string, onUploaded: () => void}): any
    signedIn: boolean
    requiresSignIn: boolean
}

const createUserStorageClient = (opts: {google: GoogleUserStorageClientOpts | null}): UserStorageClient => {
    if (opts.google) {
        return new GoogleUserStorageClient(opts.google)
    }
    else {
        throw Error('Invalid opts in createUserStorageClient')
    }
}

export const useSignedIn = (userStorageClient: UserStorageClient) => {
    const [signedIn, setSignedIn] = useState<boolean>(userStorageClient.signedIn)
    useEffect(() => {
        userStorageClient.onSignedInChanged(() => {
            setSignedIn(userStorageClient.signedIn)
        })
    }, [userStorageClient])
    return signedIn
}

export default createUserStorageClient