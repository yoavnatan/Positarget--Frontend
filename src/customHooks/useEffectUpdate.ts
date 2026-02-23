import { DependencyList, useEffect, useRef } from "react"


export const useEffectUpdate = (callBack: () => void, dependencies: DependencyList | undefined) => {

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        callBack()
    }, dependencies)
}