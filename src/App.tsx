import { useState } from 'react';
import './App.css';
import GoogleDriveFile from './components/google/GoogleDriveFile';
import SelectFile from './components/SelectFile/SelectFile';
import SurfaceViewFromFile from './components/SurfaceView/SurfaceViewFromFile';
import appMd from './app.md.gen'
import Markdown from './components/common/Markdown';

function App() {
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null)
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
      
    </div>
  );
}

export default App;
