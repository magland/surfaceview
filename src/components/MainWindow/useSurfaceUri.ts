import {useLocation, useHistory} from 'react-router-dom'
import QueryString from 'querystring'
import { useCallback } from 'react'

const useSurfaceUri = () => {
    const location = useLocation()
    const history = useHistory()
    const query = QueryString.parse(location.search.slice(1));
    const surfaceUri = query.surface as string
    const setSurfaceUri = useCallback((uri: string) => {
        const search = queryString({...query, surface: uri})
        history.push({...location, search})
    }, [location, history, query])

    return {surfaceUri, setSurfaceUri}
}

var queryString = (params: { [key: string]: string }) => {
    const keys = Object.keys(params)
    if (keys.length === 0) return ''
    return '?' + (
        keys.map((key) => {
            return encodeURIComponent(key) + '=' + params[key]
        }).join('&')
    )
}

export default useSurfaceUri