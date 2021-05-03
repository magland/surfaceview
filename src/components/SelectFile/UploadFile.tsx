import { Button } from '@material-ui/core'
import { DropzoneArea } from 'material-ui-dropzone'
import React, { useCallback, useState } from 'react'
import { FunctionComponent } from "react"
import getFolderId from '../../userStorage/google/getFolderId'
import GoogleUserStorageClient from '../../userStorage/google/GoogleUserStorageClient'

type Props = {
    client: GoogleUserStorageClient
    folderName: string
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

const UploadFile: FunctionComponent<Props> = ({ client, folderName, onUploaded }) => {
    const [uploadAreaVisible, setUploadAreaVisible] = useState<boolean>(false)
    const handleChange = useCallback((files: File[]) => {
        ;(async () => {
            for (let file of files) {
                const res = await uploadFile(client.gapi, folderName, file)
                if (res.ok) onUploaded()
            }
            if (files.length > 0) {
                setUploadAreaVisible(false)
            }
        })()
    }, [onUploaded, client.gapi, folderName])
    const handleClick = useCallback(() => {
        setUploadAreaVisible(true)
    }, [])
    return (
        <div>
            {
                uploadAreaVisible ? (
                    <DropzoneArea
                        onChange={handleChange}
                        maxFileSize={1000 * 1000 * 1000}
                    />
                ) : (
                    <Button onClick={handleClick}>Upload a file from your computer</Button>
                )
            }
            
        </div>
    )
}

export default UploadFile