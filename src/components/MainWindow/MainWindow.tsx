import { Modal } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import useComputeEngineClient, { useComputeEngineInterface } from '../../computeEngine/useComputeEngineClient';
import ApplicationBar from './ApplicationBar';
import SettingsWindow from './SettingsWindow';
import SurfaceView, {SurfaceData} from '../SurfaceView/SurfaceView'
import { FeedId } from '../../common/misc';
import { SubfeedHash } from '../../kacheryDaemonInterface/kacheryTypes';
import Hyperlink from '../common/Hyperlink';
import MainView from '../MainView/MainView';
import {useLocation, useHistory} from 'react-router-dom'
import QueryString from 'querystring'
import SelectSurface from './SelectSurface';
import useSurfaceUri from './useSurfaceUri';

// Thanks: https://stackoverflow.com/questions/36862334/get-viewport-window-height-in-reactjs
function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}
function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

type Props = {
    version?: string
    width?: number
    height?: number
}

const MainWindow: FunctionComponent<Props> = ({ version, width, height }) => {
    const { width: width2, height: height2 } = useWindowDimensions()
    const appBarHeight = 72 // hard-coded for now - must agree with theme
    const H = (height || height2) - appBarHeight - 2
    const hMargin = 0
    const W = (width || width2) - hMargin * 2 - 2

    const [settingsVisible, setSettingsVisible] = useState(false)
    const handleOpenSettings = useCallback(() => {
        setSettingsVisible(true)
    }, [])
    const handleCloseSettings = useCallback(() => {
        setSettingsVisible(false)
    }, [])

    const [surfaceData, setSurfaceData] = useState<SurfaceData | undefined>(undefined)

    const computeEngineInterface = useComputeEngineInterface()
    const computeEngineConfigUri = computeEngineInterface.computeEngineConfigUri
    const computeEngineClient = useComputeEngineClient()

    // const handleTest = useCallback(() => {
    //   if (!computeEngineClient) return
    // //   const t0 = computeEngineClient.initiateTask('test1', {delay: 0, dummy: 12})
    // //   if (t0) {
    // //       t0.onStatusChanged((s) => {
    // //         console.log('task status changed', s, t0.returnValue)
    // //       })
    // //   }
    // //   const t = computeEngineClient.initiateTask('load_surface', {uri: 'sha1://6c6f0ba365db4901d6d8d32db13cc2286f250b50/surf.mesh.json'})
    // //   if (t) {
    // //     t.onStatusChanged((s) => {
    // //       console.log('task status changed', s, t.returnValue)
    // //       if (t.status === 'finished') {
    // //           const ret = t.returnValue as any as SurfaceData
    // //           setSurfaceData(ret)
    // //       }
    // //     })
    // //   }
    //   computeEngineClient.subscribeToSubfeed({
    //       feedId: '7f4e0a3609cfd072f53be8cfe722a9036bb82e0e46fb6f7dfd04578205782d61' as any as FeedId,
    //       subfeedHash: '668f8a9f503cde03da8cf231371eb2fcf659564e' as any as SubfeedHash,
    //       startPosition: 0,
    //       onMessage: (msg, i) => {
    //         console.log('TEST: got message', msg, i)
    //       }
    //   })
    // }, [computeEngineClient])

    const {surfaceUri, setSurfaceUri} = useSurfaceUri()

    return (
        <div style={{margin: 0}}>
            <ApplicationBar
                onOpenSettings={handleOpenSettings}
            />

            {
                computeEngineConfigUri ? (
                    computeEngineClient ? (
                        surfaceUri ? (  
                            <MainView />
                        ) : (
                            <SelectSurface onSelected={setSurfaceUri} />
                        )
                    ) : <div>Initializing compute engine client...</div>
                ) : (
                    <p>No <Hyperlink onClick={handleOpenSettings}>compute engine</Hyperlink> selected.</p>
                )
            }
            {/* <div style={{position: 'absolute', top: appBarHeight}}>
                <span>This is a test</span>
                {
                    computeEngineClient && (
                        <button onClick={handleTest} title="test for developers">Test for developers</button>
                    )
                }
            </div> */}
            <div>
                {
                    surfaceData && (
                        <SurfaceView surfaceData={surfaceData} />
                    )
                }
            </div>
            
            <Modal
                open={settingsVisible}
                onClose={handleCloseSettings}
                style={{zIndex: 9999}}
            >
                <span>
                    <SettingsWindow
                        version={version}
                        onClose={handleCloseSettings}
                    />
                </span>
            </Modal>
        </div>
    )
}


export default MainWindow