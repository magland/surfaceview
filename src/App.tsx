import './App.css';
import ComputeEngineContext from './computeEngine/ComputeEngineContext';
import MainWindow from './components/MainWindow/MainWindow';
import useInitializeComputeEngineInterface from './computeEngine/useInitializeComputeEngineInterface';

// // USER STORAGE CLIENT
// // Client ID and API key from the Developer Console
// const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
// const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY
// if (!GOOGLE_CLIENT_ID) {
//     console.warn(`Environment variable not set: REACT_APP_GOOGLE_CLIENT_ID`)
// }
// if (!GOOGLE_API_KEY) {
//     console.warn(`Environment variable not set: REACT_APP_GOOGLE_API_KEY`)
// }
// // Authorization scopes required by the API; multiple scopes can be
// // included, separated by spaces.
// const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';
// let userStorageClient: UserStorageClient | null = null
// if (GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
//     userStorageClient = createUserStorageClient({google: {apiKey: GOOGLE_API_KEY, clientId: GOOGLE_CLIENT_ID, scopes: GOOGLE_SCOPES}})
// }

function App() {
  // const [selectedFile, setSelectedFile] = useState<UserStorageFile | null>(null)
  const computeEngineInterface = useInitializeComputeEngineInterface()

  // const handleTest = useCallback(() => {
  //   const taskManager = computeEngineInterface.taskManager
  //   if (!taskManager) return
  //   const t = taskManager.initiateTask('test1', {delay: 0, dummy: 10})
  //   if (t) {
  //     t.onStatusChanged((s) => {
  //       console.log('task status changed', s, t.returnValue)
  //     })
  //   }
  // }, [computeEngineInterface])

  const uri = 'gs://surfaceview/surfaceview-compute-engine/cog.json'
  computeEngineInterface.setComputeEngineConfigUri(uri)

  console.log('--- value for provider', computeEngineInterface.computeEngineClient)

  return (
    <div className="App">
      <ComputeEngineContext.Provider value={computeEngineInterface}>
        <MainWindow />
        {/* <Markdown
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
        {
          computeEngineInterface.taskManager && (
            <button onClick={handleTest} title="test for developers">&nbsp;</button>
          )
        } */}
      </ComputeEngineContext.Provider>
    </div>
  );
}

export default App;
