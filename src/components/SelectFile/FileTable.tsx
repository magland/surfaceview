import React, { useMemo } from 'react'
import { FunctionComponent } from "react"
import GoogleDriveFile from '../google/GoogleDriveFile'
import Hyperlink from '../common/Hyperlink'
import NiceTable from '../common/NiceTable/NiceTable'

type Props = {
    files: GoogleDriveFile[]
    onSelectFile: (file: GoogleDriveFile) => void
}

const FileTable: FunctionComponent<Props> = ({files, onSelectFile}) => {
    const columns = useMemo(() => ([
        {
            key: 'name',
            label: 'Name'
        }
    ]), [])
    const rows = useMemo(() => (
        files.map(file => ({
            key: file.name,
            columnValues: {
                name: {
                    text: file.name,
                    element: <Hyperlink onClick={() => {onSelectFile(file)}}>{file.name}</Hyperlink>
                }
            }
        }))
    ), [files, onSelectFile])
    return (
        <NiceTable
            columns={columns}
            rows={rows}
        />
    )
}

export default FileTable