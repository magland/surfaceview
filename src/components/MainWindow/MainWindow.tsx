import { Modal } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import useComputeEngineClient from '../../computeEngine/useComputeEngineClient';
import ApplicationBar from './ApplicationBar';
import SettingsWindow from './SettingsWindow';
import SurfaceView, {SurfaceData} from '../SurfaceView/SurfaceView'
import { PubsubChannel } from '../../pubsub/createPubsubClient';

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

    const computeEngineClient = useComputeEngineClient()

    const handleTest = useCallback(() => {
      if (!computeEngineClient) return
      // const t = taskManager.initiateTask('test1', {delay: 0, dummy: 11})
      const t = computeEngineClient.initiateTask('load_surface', {uri: 'sha1://6c6f0ba365db4901d6d8d32db13cc2286f250b50/surf.mesh.json'})
      if (t) {
        t.onStatusChanged((s) => {
          console.log('task status changed', s, t.returnValue)
          if (t.status === 'finished') {
              setSurfaceData(t.returnValue)
          }
        })
      }
      const sf: PubsubChannel = computeEngineClient.getSubfeed({feedId: '41fd0373d06533388f7b4a0d71dc964101174e67aa1a6f6582e109adcba8811c', subfeedHash: '668f8a9f503cde03da8cf231371eb2fcf659564e'})
      sf.subscribe((msg) => {
          console.log('--- got message', msg.data)
      })
    }, [computeEngineClient])

    console.log('---', computeEngineClient)

    return (
        <div style={{margin: 0}}>
            <ApplicationBar
                onOpenSettings={handleOpenSettings}
            />
            <div style={{position: 'absolute', top: appBarHeight}}>
                <span>This is a test</span>
                {
                    computeEngineClient && (
                        <button onClick={handleTest} title="test for developers">Test for developers</button>
                    )
                }
            </div>
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
                    />
                </span>
            </Modal>
        </div>
    )
}

export default MainWindow