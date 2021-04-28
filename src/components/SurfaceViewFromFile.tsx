import React, { useEffect, useState } from 'react'
import { FunctionComponent } from "react"
import GoogleDriveFile from './google/GoogleDriveFile'
import useGoogleApi from './google/useGoogleApi'
import SurfaceView from './SurfaceView'

type Props = {
    file: GoogleDriveFile
}

const SurfaceViewFromFile: FunctionComponent<Props> = ({file}) => {
    const {gapi} = useGoogleApi()
    const [surfaceData, setSurfaceData] = useState<any | null>(null)

    useEffect(() => {
        if (!gapi) return
        console.log('----', file)
        gapi.client.drive.files.get({fileId: file.id, alt: 'media'}).then((resp: any) => {
            setSurfaceData(JSON.parse(resp.body))
        })
    }, [gapi, file])

    useEffect(() => {
        console.log('---', surfaceData)
    }, [surfaceData])

    return (
        <span>
            {
                surfaceData ? (
                    <SurfaceView
                        surfaceData={surfaceData}
                    />
                ) : (<div>Loading...</div>)
            }
        </span>
    )
}

export default SurfaceViewFromFile