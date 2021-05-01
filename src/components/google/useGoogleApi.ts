import { useEffect, useState } from "react"

const useGoogleApi = () => {
    const [gapi, setGapi] = useState<any | null | undefined>(undefined)
    const [signedIn, setSignedIn] = useState<boolean>(false)
    
    useEffect(() => {
        const g = (window as any).gapi
        g.load('client:auth2', () => {
            /**
             *  Initializes the API client library
             */

            // Client ID and API key from the Developer Console
            var CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
            var API_KEY = process.env.REACT_APP_GOOGLE_API_KEY

            if (!CLIENT_ID) {
                console.warn(`Environment variable not set: REACT_APP_GOOGLE_CLIENT_ID`)
            }
            if (!API_KEY) {
                console.warn(`Environment variable not set: REACT_APP_GOOGLE_API_KEY`)
            }
            if (!(CLIENT_ID && API_KEY)) {
                setGapi(null)
                return
            }

            // Array of API discovery doc URLs for APIs used by the quickstart
            var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

            // Authorization scopes required by the API; multiple scopes can be
            // included, separated by spaces.
            var SCOPES = 'https://www.googleapis.com/auth/drive.file';

            g.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES
            }).then(function () {
                // Listen for sign-in state changes.
                g.auth2.getAuthInstance().isSignedIn.listen(() => {
                    setSignedIn(g.auth2.getAuthInstance().isSignedIn.get())
                });
                setSignedIn(g.auth2.getAuthInstance().isSignedIn.get())
                setGapi(g)
            }).catch((error: Error) => {
                console.warn(error)
            });
        });
    }, [])
    return {gapi, signedIn}
}

export default useGoogleApi