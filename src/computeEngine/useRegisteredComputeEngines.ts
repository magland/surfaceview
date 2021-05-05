import { useComputeEngineInterface } from "./useComputeEngineClient"

const useRegisteredComputeEngines = () => {
    const x = useComputeEngineInterface()
    return x.registeredComputeEngines
}

export default useRegisteredComputeEngines