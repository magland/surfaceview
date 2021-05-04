import { useContext } from "react"
import ComputeEngineContext from "./ComputeEngineContext"

export const useComputeEngineInterface = () => {
    return useContext(ComputeEngineContext)
}

export const useComputeEngineClient = () => {
    const x = useComputeEngineInterface()
    return x.computeEngineClient
}

export default useComputeEngineClient