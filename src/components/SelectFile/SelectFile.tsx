import { FunctionComponent, useCallback, useState } from "react";
import FileTable from "./FileTable";
import SelectFileMd from './SelectFile.md.gen'
import Markdown from "../common/Markdown";
import { UserStorageClient, UserStorageFile, useSignedIn } from "../../userStorage/createUserStorageClient";
import useListFiles from "../../userStorage/useListFiles";

type Props = {
    userStorageClient: UserStorageClient
    folderName: string
    onFileSelected: (file: UserStorageFile) => void
}

const SelectFile: FunctionComponent<Props> = ({userStorageClient, folderName, onFileSelected}) => {
    const [updateCode, setUpdateCode] = useState<number>(0)
    const incrementUpdateCode = useCallback(() => {
        setUpdateCode(c => (c+1))
    }, [])

    const files = useListFiles(userStorageClient, folderName, updateCode)
    
    const handleSelectFile = useCallback((file: UserStorageFile) => {
        onFileSelected(file)
    }, [onFileSelected])

    const signedIn = useSignedIn(userStorageClient)

    return (
        <div>
            <Markdown source={SelectFileMd} />
            {
                userStorageClient.signInButton()
            }
            {
                signedIn && (
                    <span>
                        {
                            userStorageClient.uploadFileComponent({folderName: 'surfaceview', onUploaded: incrementUpdateCode})
                        }
                        {
                            files && <FileTable
                                files={files}
                                onSelectFile={handleSelectFile}
                            />
                        }
                    </span>
                )
            }
        </div>
    )
}

export default SelectFile