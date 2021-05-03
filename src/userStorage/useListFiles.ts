import { useEffect, useState } from "react"
import { UserStorageClient, UserStorageFile, useSignedIn } from "./createUserStorageClient"

const useListFiles = (client: UserStorageClient, folderName: string, updateCode: number) => {
    const [files, setFiles] = useState<UserStorageFile[] | undefined>(undefined)
    const signedIn = useSignedIn(client)
    useEffect(() => {
        if (!signedIn) return
        client.listFiles(folderName, updateCode).then((files: UserStorageFile[] | undefined) => {
            setFiles(files)
        })
    }, [client, updateCode, folderName, signedIn])
    
    return files
}

export default useListFiles