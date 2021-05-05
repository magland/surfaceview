import { Button } from '@material-ui/core'
import React, { useCallback, useMemo } from 'react'
import { FunctionComponent } from "react"
import { useComputeEngineInterface } from '../../computeEngine/useComputeEngineClient'
import useRegisteredComputeEngines from '../../computeEngine/useRegisteredComputeEngines'
import NiceTable from '../common/NiceTable/NiceTable'

type Props = {
    onSelectComputeEngine: (uri: string) => void
}

const SelectComputeEngine: FunctionComponent<Props> = ({onSelectComputeEngine}) => {
    const registeredComputeEngines = useRegisteredComputeEngines()
    const computeEngineInterface = useComputeEngineInterface()
    const columns = useMemo(() => ([
        {
            key: 'label',
            label: 'Compute engine'
        },
        {
            key: 'uri',
            label: 'URI'
        }
    ]), [])
    // const handleSelect = useCallback((uri: string) => {
    //     computeEngineInterface.setComputeEngineConfigUri(uri)
    // }, [])
    const rows = useMemo(() => (
        (registeredComputeEngines || []).map(x=> ({
            key: x.computeEngineConfigUri,
            columnValues: {
                label: {
                    text: x.computeEngineConfig.label
                    // element: <Hyperlink onClick={() => {handleSelect(x.computeEngineConfigUri)}}>{x.computeEngineConfig.label}</Hyperlink>
                },
                uri: x.computeEngineConfigUri
            }
        }))
    ), [registeredComputeEngines])
    const handleSelectedRowKeysChanged = useCallback((uris: string[]) => {
        if (uris[0]) {
            onSelectComputeEngine(uris[0])
        }
    }, [onSelectComputeEngine])
    const handleRefresh = useCallback(() => {
        computeEngineInterface.refreshRegisteredComputeEngines()
    }, [computeEngineInterface])
    return (
        <div>
            <h3>Select a compute engine</h3>
            <Button onClick={handleRefresh}>Refresh</Button>
            {
                registeredComputeEngines === undefined ? (
                    <div>Loading registered compute engines</div>
                ) : registeredComputeEngines.length === 0 ? (
                    <div>No compute engines registered</div>
                ) : (
                    <NiceTable
                        columns={columns}
                        rows={rows}
                        selectionMode={"single"}
                        selectedRowKeys={computeEngineInterface.computeEngineConfigUri ? {[computeEngineInterface.computeEngineConfigUri]: true} : {}}
                        onSelectedRowKeysChanged={handleSelectedRowKeysChanged}
                    />
                )
            }
        </div>
    )
}

export default SelectComputeEngine