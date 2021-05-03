import { useCallback, useState } from 'react';
import './App.css';
import SelectFile from './components/SelectFile/SelectFile';
import SurfaceViewFromFile from './components/SurfaceView/SurfaceViewFromFile';
import appMd from './app.md.gen'
import Markdown from './components/common/Markdown';
import initiateTask from './tasks/initiateTask';
import createUserStorageClient, {UserStorageClient, UserStorageFile} from './userStorage/createUserStorageClient'

// Client ID and API key from the Developer Console
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY
if (!GOOGLE_CLIENT_ID) {
    console.warn(`Environment variable not set: REACT_APP_GOOGLE_CLIENT_ID`)
}
if (!GOOGLE_API_KEY) {
    console.warn(`Environment variable not set: REACT_APP_GOOGLE_API_KEY`)
}
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';
let userStorageClient: UserStorageClient | null = null
if (GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
    userStorageClient = createUserStorageClient({google: {apiKey: GOOGLE_API_KEY, clientId: GOOGLE_CLIENT_ID, scopes: GOOGLE_SCOPES}})
}

function App() {
  const [selectedFile, setSelectedFile] = useState<UserStorageFile | null>(null)
  const handleTest = useCallback(() => {
    const t = initiateTask('test1', {delay: 0, dummy: 3})
    if (t) {
      t.onStatusChanged((s) => {
        console.log('task status changed', s)
      })
    }
  }, [])
  return (
    <div className="App">
      <Markdown
          source={appMd}
      />
      {
        userStorageClient && (
          (selectedFile === null) ? (
            <SelectFile userStorageClient={userStorageClient} folderName={"surfaceview"} onFileSelected={setSelectedFile} />
          ) : (
            <SurfaceViewFromFile file={selectedFile} />
          )
        )
      }
      <button onClick={handleTest} title="test for developers">&nbsp;</button>
      
    </div>
  );
}

export default App;
