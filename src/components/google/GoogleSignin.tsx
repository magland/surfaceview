import React, { useCallback } from 'react'
import { FunctionComponent } from "react";
import ReactGoogleButton from 'react-google-button'
import useGoogleApi from './useGoogleApi';

type Props = {
    
}

const GoogleSignin: FunctionComponent<Props> = () => {
    const {gapi, signedIn} = useGoogleApi()

    const handleSignIn = useCallback(() => {
        gapi.auth2.getAuthInstance().signIn();
    }, [gapi])
    const handleSignOut = useCallback(() => {
        gapi.auth2.getAuthInstance().signOut()
    }, [gapi])

    return <div>
        {
            <span>
                <h3>Google drive</h3>
                {
                    gapi ? (
                        signedIn ? (
                            <span>
                                <button onClick={handleSignOut}>Sign out</button>
                            </span>
                        ) : (
                            <ReactGoogleButton onClick={handleSignIn} />
                        )
                    ) : (<div>Loading google api</div>)
                }
            </span>
        }
    </div>
}

export default GoogleSignin