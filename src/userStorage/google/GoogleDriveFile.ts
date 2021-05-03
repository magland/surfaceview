class GoogleDriveFile {
    constructor(private gapi: any, private f: {id: string, mimeType: string, name: string}) {

    }
    public get id() {
        return this.f.id
    }
    public get mimeType() {
        return this.f.mimeType
    }
    public get name() {
        return this.f.name
    }
    async downloadContent() {
        const resp = await this.gapi.client.drive.files.get({fileId: this.id, alt: 'media'})
        return resp.body
    }
}

export default GoogleDriveFile