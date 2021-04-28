import { FunctionComponent, useCallback, useState } from "react";
import FileTable from "./FileTable";
import GoogleDriveFile from "../google/GoogleDriveFile";
import GoogleSignin from "../google/GoogleSignin";
import useGoogleApi from "../google/useGoogleApi";
import useListFiles from "../google/useListFiles";
import UploadFile from "./UploadFile";
import SelectFileMd from './SelectFile.md.gen'
import Markdown from "../common/Markdown";

type Props = {
    folderName: string
    onFileSelected: (file: GoogleDriveFile) => void
}

const SelectFile: FunctionComponent<Props> = ({folderName, onFileSelected}) => {
    const {gapi, signedIn} = useGoogleApi()
    const [updateCode, setUpdateCode] = useState<number>(0)
    const incrementUpdateCode = useCallback(() => {
        setUpdateCode(c => (c+1))
    }, [])

    const files = useListFiles(folderName, updateCode)
    
    const handleSelectFile = useCallback((file: GoogleDriveFile) => {
        onFileSelected(file)
    }, [onFileSelected])

    return (
        <div>
            <Markdown source={SelectFileMd} />
            <GoogleSignin />
            {
                signedIn && gapi && (
                    <span>
                        <UploadFile folderName={folderName} gapi={gapi} onUploaded={incrementUpdateCode} />
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