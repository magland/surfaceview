import { useEffect, useState } from "react"
import getFolderId from "./getFolderId"
import useGoogleApi from "./useGoogleApi"
import GoogleDriveFile from './GoogleDriveFile'

const useListFiles = (folderName: string, updateCode: number) => {
    const {gapi, signedIn} = useGoogleApi()
    const [files, setFiles] = useState<GoogleDriveFile[] | undefined>(undefined)
    useEffect(() => {
        if (!gapi) return
        if (!signedIn) return
        ;(async () => {
            const folderId = await getFolderId(gapi, folderName)
            const response = await gapi.client.drive.files.list({
                "q": `trashed = false and '${folderId}' in parents`
                // 'fields': "files(id, name, webContentLink, webViewLink)"
            })
            var f = response.result.files as GoogleDriveFile[]
            setFiles(f)
        })()
    }, [gapi, signedIn, updateCode, folderName])
    
    return files
}

export default useListFiles