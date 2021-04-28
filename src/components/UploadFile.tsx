import { DropzoneArea } from 'material-ui-dropzone'
import React, { useCallback } from 'react'
import { FunctionComponent } from "react"
import getFolderId from './google/getFolderId'

type Props = {
    folderName: string
    gapi: any
    onUploaded: () => void
}

const uploadFile = async (gapi: any, folderName: string, file: File) => {
    const folderId = await getFolderId(gapi, folderName)
    var metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [folderId]
    };
    var form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({'Authorization': 'Bearer ' + gapi.auth.getToken().access_token}),
        body: form
    })
    return res
}

const UploadFile: FunctionComponent<Props> = ({ folderName, gapi, onUploaded }) => {
    const handleChange = useCallback((files: File[]) => {
        ;(async () => {
            for (let file of files) {
                const res = await uploadFile(gapi, folderName, file)
                if (res.ok) onUploaded()
            }
        })()
    }, [onUploaded, gapi, folderName])
    return (
        <div>
            <DropzoneArea
                onChange={handleChange}
                maxFileSize={1000 * 1000 * 1000}
            />
        </div>
    )
}

export default UploadFile