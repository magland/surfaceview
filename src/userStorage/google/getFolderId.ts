const getFolderId = async (gapi: any, folderName: string) => {
    const response = await gapi.client.drive.files.list({
        "q": `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed = false`
    })
    const files = response.result.files;
    if (files) {
        for (let f of files) {
            if (f.mimeType === 'application/vnd.google-apps.folder') {
                return f.id
            }
        }
    }
    var folderMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder'
    };
    const resp2 = await gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
    })
    return resp2.result.id
}

export default getFolderId