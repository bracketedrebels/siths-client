/** @format */

import { useCallback, useMemo, useState } from "react"

export const useBooleanState = (initialValue: boolean) => {
  const [state, setState] = useState(initialValue)
  const on = useCallback(() => setState(true), [])
  const off = useCallback(() => setState(false), [])
  const toggle = useCallback(() => setState(prev => !prev), [])
  const setBooleanState = useMemo(() => ({ on, off, toggle }), [on, off, toggle])
  return useMemo(() => [state, setBooleanState] as const, [state, setBooleanState])
}
