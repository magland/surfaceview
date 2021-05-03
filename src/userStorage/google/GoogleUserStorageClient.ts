import React from 'react'
import getFolderId from "./getFolderId";
import GoogleDriveFile from "./GoogleDriveFile";
import GoogleSignInClient from '../../googleSignIn/GoogleSignInClient';
import UploadFile from '../../components/SelectFile/UploadFile';

export type GoogleUserStorageClientOpts = {
    clientId: string
    apiKey: string
    scopes: string
}

class GoogleUserStorageClient {
    #signInClient: GoogleSignInClient
    constructor(private opts: GoogleUserStorageClientOpts) {
        this.#signInClient = new GoogleSignInClient(opts)
    }
    public get requiresSignIn(): boolean {
        return true
    }
    signInButton(): any {
        return this.#signInClient.signInButton
    }
    uploadFileComponent(props: {folderName: string, onUploaded: () => void}): any {
        return React.createElement(UploadFile, {client: this, folderName: props.folderName, onUploaded: props.onUploaded})
    }
    onSignedInChanged(callback: (val: boolean) => void) {
        this.#signInClient.onSignedInChanged(callback)
    }
    async listFiles(folderName: string, updateCode: number) {
        const gapi = this.#signInClient.gapi
        const signedIn = this.#signInClient.signedIn
        if (!gapi) return undefined
        if (!signedIn) return undefined
        const folderId = await getFolderId(gapi, folderName)
        const response = await gapi.client.drive.files.list({
            "q": `trashed = false and '${folderId}' in parents`
            // 'fields': "files(id, name, webContentLink, webViewLink)"
        })
        return response.result.files.map((x: any) => (new GoogleDriveFile(gapi, x)))
    }
    public get signedIn() {
        return this.#signInClient.signedIn
    }
    public get gapi() {
        return this.#signInClient.gapi
    }
}

export default GoogleUserStorageClient