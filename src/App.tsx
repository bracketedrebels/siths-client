/** @format */

import { chunk, Dictionary } from "lodash"
import { add, isNil, noop, random } from "lodash/fp"
import { groupBy, range, uniq } from "ramda"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRefDimensions } from "./domain/dimensions"
import useGlobalPointerCancel from "./domain/pointercancel"
import useGlobalPointerMove from "./domain/pointermove"
import useGlobalPointerUp from "./domain/pointerup"

// graph generation stuff...
let initid = BigInt(1)
const next64bitid = () => initid++
const makeNodes = (amount: number) =>
  new Array(amount).fill(next64bitid).map(v => v()) as bigint[]

const defaultGraphConfig = {
  stopThreshold: 10,
  probabilityThreshold: 0.5,
  splitMax: 4,
  splitMin: 1,
  mergeMax: 4,
  mergeMin: 1,
  sourcesAmount: 2,
}
const generateGraph = (
  cfg = defaultGraphConfig as Partial<typeof defaultGraphConfig>
) => {
  const {
    mergeMax,
    mergeMin,
    probabilityThreshold,
    sourcesAmount,
    splitMax,
    splitMin,
    stopThreshold,
  } = { ...defaultGraphConfig, ...cfg }
  function recursive(init = [] as bigint[], nodes = 0): bigint[] {
    const { merge = [], split = [] } = groupBy(
      () => (Math.random() >= probabilityThreshold ? "split" : "merge"),
      init
    )
    const groupsMergeMax = Math.floor(merge.length / (mergeMin || 1))
    const groupsMergeMin = Math.ceil(
      merge.length /
        (mergeMax < (mergeMin || 1) ? (mergeMin || 1) + 1 : mergeMax)
    )
    const mergeGroupsCount = random(groupsMergeMin, groupsMergeMax)
    const mergeGroups = merge.reduce(
      (acc, v, i) => ({
        ...acc,
        [i % mergeGroupsCount]: [...(acc[i % mergeGroupsCount] || []), v],
      }),
      {} as Dictionary<bigint[]>
    )
    const mergeLayer = makeNodes(mergeGroupsCount)
    const mergeEdges = mergeLayer.reduce(
      (acc, v, i) => mergeGroups[i].reduce((acc2, v2) => [...acc2, v2, v], acc),
      [] as bigint[]
    )

    const splitLayerSize = random(splitMin, splitMax) * split.length
    const splitLayer = makeNodes(splitLayerSize)
    const splitGroups = splitLayer.reduce(
      (acc, v, i) => ({
        ...acc,
        [i % split.length]: [...(acc[i % split.length] || []), v],
      }),
      {} as Dictionary<bigint[]>
    )
    const splitEdges = split.reduce(
      (acc, v, i) => splitGroups[i].reduce((acc2, v2) => [...acc2, v, v2], acc),
      [] as bigint[]
    )

    const resultNodesAmount = nodes + mergeLayer.length + splitLayer.length
    const resultEdges = [...init, ...mergeEdges, ...splitEdges]
    return resultNodesAmount >= stopThreshold
      ? resultEdges
      : [
          ...resultEdges,
          ...recursive([...mergeLayer, ...splitLayer], resultNodesAmount),
        ]
  }

  return recursive(makeNodes(sourcesAmount))
}
//... graph generation stuff

const canvasSize = [2000, 2000] as const
const [maxw, maxh, minw, minh] = [200, 200, 100, 100]
const edges = generateGraph({ stopThreshold: 10 })
const nodes = uniq(edges)
const $id = Symbol("id")
const testData = nodes.map(id =>
  ((preciseX, preciseY) => {
    const box = [
      ~~preciseX,
      ~~preciseY,
      ~~(preciseX + Math.max(Math.random() * maxw, minw)),
      ~~(preciseY + Math.max(Math.random() * maxh, minh)),
    ] as const
    Object.defineProperty(box, $id, { value: id })
    return box
  })(
    Math.max(Math.random() * (canvasSize[0] - maxw), 0),
    Math.max(Math.random() * (canvasSize[1] - maxh), 0)
  )
)

const clamp =
  ([vx0, vy0, vx1, vy1]: [number, number, number, number]) =>
  (data: Readonly<[number, number, number, number]>[]) =>
    data.filter(([dx0, dy0, dx1, dy1]) => {
      const left2vp = dx1 <= vx0
      const right2vp = dx0 >= vx1
      const abovevp = dy1 <= vy0
      const belowvp = dy0 >= vy1
      return !left2vp && !right2vp && !abovevp && !belowvp
    })

export default function Test() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, h] = useRefDimensions(ref)
  const [dragging, setDragging] = useState(false)
  const [draggingOffsetX, setDraggingOffsetX] = useState(0)
  const [draggingOffsetY, setDraggingOffsetY] = useState(0)
  const [canvasOffsetX, setCanvasOffsetX] = useState(0)
  const [canvasOffsetY, setCanvasOffsetY] = useState(0)

  const [actionsMenuActive, setActionsMenuActive] = useState(false)
  const [actionsMenuPosition, setActionsMenuPosition] = useState([0, 0] as [
    number,
    number
  ])

  const clamp2vp = useMemo(
    () =>
      clamp([
        -canvasOffsetX - w,
        -canvasOffsetY - h,
        2 * w - canvasOffsetX,
        2 * h - canvasOffsetY,
      ]),
    [w, h, canvasOffsetX, canvasOffsetY]
  )
  const data2render = useMemo(() => clamp2vp(testData), [clamp2vp])
  const sizesMap = data2render.reduce(
    (acc, v) => ({ ...acc, [`${v[$id as any]}`]: v }),
    {} as Dictionary<readonly [number, number, number, number]>
  )
  const edges2render = chunk(edges, 2).filter(
    ([a, b]) => `${a}` in sizesMap || `${b}` in sizesMap
  )

  const onPointerMove = useCallback((e: PointerEvent) => {
    setDraggingOffsetX(add(e.movementX))
    setDraggingOffsetY(add(e.movementY))
  }, [])
  useGlobalPointerMove(dragging ? onPointerMove : noop)

  const onPointerUpOrCancel = useCallback(() => setDragging(false), [])
  useGlobalPointerUp(onPointerUpOrCancel)
  useGlobalPointerCancel(onPointerUpOrCancel)

  useEffect(() => {
    if (!dragging) {
      if (draggingOffsetX !== 0)
        setCanvasOffsetX(v => Math.min(0, draggingOffsetX + v))
      if (draggingOffsetY !== 0)
        setCanvasOffsetY(v => Math.min(0, draggingOffsetY + v))
      setDraggingOffsetX(0)
      setDraggingOffsetY(0)
    }
  }, [dragging, draggingOffsetX, draggingOffsetY])

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  return (
    <div className='fixed inset-0 block'>
      {/* Graph rendering layer */}
      <div
        onPointerDown={onDragStart}
        onClick={e => {
          setActionsMenuPosition([e.clientX, e.clientY])
          setActionsMenuActive(true)
        }}
        className='box-border absolute inset-0 block'>
        <div
          ref={ref}
          className='absolute inset-0 block translate-x-[--x] translate-y-[--y] select-none overflow-visible'
          style={
            {
              "--x": `${
                w / 2 + Math.min(0, canvasOffsetX + draggingOffsetX)
              }px`,
              "--y": `${
                h / 2 + Math.min(0, canvasOffsetY + draggingOffsetY)
              }px`,
            } as any
          }>
          {!isNil(w) && !isNil(h)
            ? data2render.map(v => (
                <div
                  className='absolute top-0 left-0 translate-x-[--x] translate-y-[--y] p-8 flex rounded overflow-hidden bg-slate-800 flex-col items-center justify-center text-gray-200'
                  key={v[$id as any]}
                  style={
                    {
                      "--x": `${v[0]}px`,
                      "--y": `${v[1]}px`,
                    } as any
                  }>
                  <span>{`id: ${v[$id as any]}`}</span>
                  <span>{`x: ${v[0]}`}</span>
                  <span>{`y: ${v[1]}`}</span>
                </div>
              ))
            : null}
          {edges2render.map(([from, to]) => (
            <div
              style={
                {
                  "--x": `${sizesMap[`${from}`]?.[2]}px`,
                  "--y": `${sizesMap[`${from}`]?.[3]}px`,
                } as any
              }
              className='absolute top-0 left-0 translate-x-[--x] translate-y-[--y]'>
              <Edge to={[sizesMap[`${to}`]?.[0], sizesMap[`${to}`]?.[1]]} />
            </div>
          ))}
        </div>
      </div>
      {/* Some debugging information overlay layer */}
      <div className='absolute flex flex-col p-4 font-mono text-sm rounded pointer-events-none select-none top-3 left-3 bg-slate-800 text-slate-200'>
        <span>
          dragging offset: {draggingOffsetX}x, {draggingOffsetY}y
        </span>
        <span>
          canvas offset: {canvasOffsetX}x, {canvasOffsetY}y
        </span>
        <span>
          nodes rendered: {data2render.length} out of {testData.length}
        </span>
        <span>
          edges rendered: {edges2render.length} out of {edges.length}
        </span>
      </div>
      {/* Actions menu layer */}
      {actionsMenuActive ? (
        <div
          style={
            {
              "--x": `${actionsMenuPosition[0]}px`,
              "--y": `${actionsMenuPosition[1]}px`,
            } as any
          }
          className='absolute left-0 top-0 overflow-visible flex flex-col items-stretch py-4 rounded bg-slate-800 translate-x-[--x] translate-y-[--y]'>
          {range(1, 6).map(v => (
            <div className='py-2 px-6 font-mono text-sm text-slate-200 hover:bg-white/10 min-w-[300px] cursor-pointer'>
              {`${v} input${v > 1 ? "s" : ""}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const Edge = ({ to: [x, y] }: { to: [number, number] }) => (
  <div
    style={
      {
        "--w": `${Math.abs(x)}px`,
        "--h": `${Math.abs(y)}px`,
        // no typo here
        "--sx": y < 0 ? -1 : 1,
        // no typo here
        "--sy": x < 0 ? -1 : 1,
      } as any
    }
    className='
      w-[--w] h-[--h] scale-x-[--sx] scale-y-[--sy] absolute
      after:absolute after:top-1/2 after:bottom-0 after:w-1/2 after:right-0 after:border-solid after:border-l-4 after:border-b-4 after:border-slate-800 after:rounded-bl-[80%]
      before:absolute before:top-0 before:bottom-1/2 before:left-0 before:w-1/2 before:border-solid before:border-t-4 before:border-r-4 before:border-slate-800 before:rounded-tr-[80%]
    '
  />
)
