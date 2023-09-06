/** @format */

import { clamp } from "ramda"
import { PointerEvent, useCallback, useMemo, useState } from "react"
import { useBooleanState } from "../boolean"
import { Vector } from "../math/vector"

const zeroOffset = [0, 0] as Vector<2>

export default function useDrag() {
  const [dragging, setDragging] = useBooleanState(false)
  const [accumulatedOffset, setAccumulatedOffset] = useState(zeroOffset)
  const reset = useCallback(() => setAccumulatedOffset(zeroOffset), [])
  const onPointerDown = setDragging.on
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) =>
      setAccumulatedOffset(prev =>
        dragging ? ([clamp(0, Infinity, prev[0] + e.movementX), clamp(0, Infinity, prev[1] + e.movementY)] as const) : prev
      ),
    [dragging]
  )
  const onPointerUp = setDragging.off

  return useMemo(
    () => ({ reset, onPointerDown, onPointerMove, onPointerUp, dragging, accumulatedOffset }),
    [reset, onPointerDown, onPointerMove, onPointerUp, dragging, accumulatedOffset]
  )
}
