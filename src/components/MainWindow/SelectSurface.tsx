import { TextField } from '@material-ui/core'
import React, { useCallback, useState } from 'react'
import { FunctionComponent } from "react"

type Props = {
    onSelected: (uri: string) => void
}

const SelectSurface: FunctionComponent<Props> = ({onSelected}) => {
    const [uri, setUri] = useState<string>('')
    const handleChange = useCallback((evt: any) => {
        const val: string = evt.target.value
        setUri(val)
    }, [])
    const handleKeyDown = useCallback((e) => {
        if (e.keyCode === 13) {
           onSelected(uri)
        }
    }, [uri])
    return (
        <div>
            <p>Enter the URI of a surface mesh. For example: sha1://...../surf.mesh.json</p>
            <TextField id="standard-basic" label="Surface URI" value={uri} onChange={handleChange} onKeyDown={handleKeyDown} />
        </div>
    )
}

export default SelectSurface