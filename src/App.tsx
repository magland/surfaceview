import { useState } from 'react';
import './App.css';
import GoogleDriveFile from './components/google/GoogleDriveFile';
import SelectFile from './components/SelectFile';
import SurfaceViewFromFile from './components/SurfaceViewFromFile';

function App() {
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null)
  return (
    <div className="App">
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
