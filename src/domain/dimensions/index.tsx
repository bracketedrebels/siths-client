/** @format */

import { RefObject, useLayoutEffect, useState } from "react"
import { defaultCycle, prepareUsage } from "../../util/resize"

const [Provider, use] = prepareUsage(defaultCycle)

export const DimensionsProvider = Provider
export const useDimensions = use

const fallbackDims = [0, 0] as const
export const useRefDimensions = (r: RefObject<HTMLElement | SVGElement>) => {
  const [current, setCurrent] = useState(r.current)
  useLayoutEffect(() => setCurrent(r.current), [r])
  const dims = use(current)
  return dims || fallbackDims
}
