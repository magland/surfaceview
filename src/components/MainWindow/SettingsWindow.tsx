import { Table, TableCell, TableRow } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { FunctionComponent } from 'react';
import useComputeEngineClient, { useComputeEngineInterface } from '../../computeEngine/useComputeEngineClient';

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
}

const SettingsWindow: FunctionComponent<Props> = ({ version }) => {
    const classes = useStyles();
    const computeEngineClient = useComputeEngineClient()
    const computeEngineInterface = useComputeEngineInterface()
    return (
        <div className={classes.paper} style={{zIndex: 9999}}>
            <h2>Surface view {version || ''}</h2>
            <Table>
                <TableRow>
                    <TableCell>Compute engine</TableCell>
                    <TableCell>{computeEngineInterface.computeEngineConfigUri || ''}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Task manager</TableCell>
                    <TableCell>{computeEngineClient ? 'Initialized' : 'Not initialized'}</TableCell>
                </TableRow>
            </Table>
        </div>
    )
}

export default SettingsWindow