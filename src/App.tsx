import { useCallback, useState } from 'react';
import './App.css';
import GoogleDriveFile from './components/google/GoogleDriveFile';
import SelectFile from './components/SelectFile/SelectFile';
import SurfaceViewFromFile from './components/SurfaceView/SurfaceViewFromFile';
import appMd from './app.md.gen'
import Markdown from './components/common/Markdown';
import initiateTask from './tasks/initiateTask';

function App() {
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null)
  const handleTest = useCallback(() => {
    const t = initiateTask('test1', {delay: 13})
    t.onStatusChanged((s) => {
      console.log('task status changed', s)
    })
  }, [])
  return (
    <div className="App">
      <Markdown
          source={appMd}
      />
      {
        selectedFile === null ? (
          <SelectFile folderName={"surfaceview"} onFileSelected={setSelectedFile} />
        ) : (
          <SurfaceViewFromFile file={selectedFile} />
        )
      }
      <button onClick={handleTest} title="test for developers">&nbsp;</button>
      
    </div>
  );
}

export default App;
