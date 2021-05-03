import React, { useEffect, useState } from 'react'
import { FunctionComponent } from "react"
import { UserStorageFile } from '../../userStorage/createUserStorageClient'
import SurfaceView from './SurfaceView'

type Props = {
    file: UserStorageFile
}

const SurfaceViewFromFile: FunctionComponent<Props> = ({file}) => {
    const [surfaceData, setSurfaceData] = useState<any | null>(null)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!file) return
        file.downloadContent().then((data: any) => {
            setSurfaceData(JSON.parse(data))
        }).catch((err: Error) => {
            console.warn(err)
            setError(err)
        })
    }, [file])

    return (
        <span>
            {
                surfaceData ? (
                    <SurfaceView
                        surfaceData={surfaceData}
                    />
                ) : error ? (
                    <div>Error loading data</div>
                ) : (
                    <div>Loading...</div>
                )
            }
        </span>
    )
}

export default SurfaceViewFromFile