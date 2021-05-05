import { Button, IconButton, Table, TableCell, TableRow } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close } from '@material-ui/icons';
import React, { FunctionComponent, useCallback } from 'react';
import useComputeEngineClient, { useComputeEngineInterface } from '../../computeEngine/useComputeEngineClient';
import useRegisteredComputeEngines from '../../computeEngine/useRegisteredComputeEngines';
import SelectComputeEngine from './SelectComputeEngine';

const useStyles = makeStyles((theme) => ({
    paper: {
        left: 100,
        top: 100,
        right: 100,
        bottom: 100,
        position: 'absolute',
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
        overflow: 'auto'
    },
}));

type Props = {
    version?: string
    onClose?: () => void
}

const SettingsWindow: FunctionComponent<Props> = ({ version, onClose }) => {
    const classes = useStyles();
    const registeredComputeEngines = useRegisteredComputeEngines()
    const computeEngineClient = useComputeEngineClient()
    const computeEngineInterface = useComputeEngineInterface()
    const handleSelectComputeEngine = useCallback((uri: string) => {
        computeEngineInterface.setComputeEngineConfigUri(uri)
    }, [computeEngineInterface])
    return (
        <div className={classes.paper} style={{zIndex: 9999}}>
            {
                onClose && <IconButton onClick={onClose}><Close /></IconButton>
            }
            <SelectComputeEngine
                onSelectComputeEngine={handleSelectComputeEngine}
            />
            {/* <Table>
                <TableRow>
                    <TableCell>Compute engine</TableCell>
                    <TableCell>{computeEngineInterface.computeEngineConfigUri || ''}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Task manager</TableCell>
                    <TableCell>{computeEngineClient ? 'Initialized' : 'Not initialized'}</TableCell>
                </TableRow>
            </Table> */}
        </div>
    )
}

export default SettingsWindow