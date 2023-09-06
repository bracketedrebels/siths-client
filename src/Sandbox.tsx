/** @format */

import { DocumentIcon, FolderOpenIcon, Squares2X2Icon, TrashIcon } from "@heroicons/react/20/solid"
import { random } from "lodash"
import { inc } from "ramda"
import RBush from "rbush"
import { PointerEvent, WheelEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useBooleanState } from "./util/boolean"
import { Vector, clamp, scale, sub, sum, vector } from "./util/math/vector"

// const NodesStore = store(rdf(memoryBackend()))
// const BoxesStore = store(keyvalue(storage(backend(localStorage), codec(decimalCodec(10), JSONCodec()))))
// const { Finder, useVirtualized } = virtualization(general2d(), unifiedMeasurment())
// const allNodesQuery = sparql`select distinct ?node where { ?node ${Relation.Just} ?node }`

type TempRect = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: number
}

const zeroOffset = [0, 0] as Vector<2>
const positiveQuater = [vector(2, 0), vector(2, Infinity)] as const

export default function Sandbox() {
  const rtree = useMemo(() => new RBush<TempRect>(), [])
  const [currentNodeId, setCurrentNodeId] = useState(1)
  const [dragging, setDragging] = useBooleanState(false)
  const [drawing, setDrawing] = useBooleanState(false)
  const [accumulatedOffset, setAccumulatedOffset] = useState(zeroOffset)
  const reset = useCallback(() => setAccumulatedOffset(zeroOffset), [])
  const finderRef = useRef<HTMLDivElement>(null)
  const [finderOffset, setFinderOffset] = useState(vector(2, 0))
  const [finderDims, setFinderDims] = useState(vector(2, 0))
  const [dataDirty, setDataDirty] = useBooleanState(true)
  const resizeSensor = useMemo(
    () =>
      new ResizeObserver(v => {
        const dim = [v[0].contentBoxSize[0].inlineSize, v[0].contentBoxSize[0].blockSize] as Vector<2>
        setFinderDims(dim)
      }),
    []
  )
  useLayoutEffect(() => {
    const { current } = finderRef
    if (current) {
      resizeSensor.observe(current)
      return () => resizeSensor.unobserve(current)
    }
  }, [resizeSensor])
  const [data, setData] = useState([] as TempRect[])

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {}, [])
  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    // primary mouse button only
    if (e.buttons === 1) {
      setDragging.on()
    }
  }, [])
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) =>
      setAccumulatedOffset(prev => (dragging ? ([prev[0] + e.movementX, prev[1] + e.movementY] as const) : prev)),
    [dragging]
  )
  const onPointerUpCapture = useCallback(() => {
    setFinderOffset(v => clamp(positiveQuater, sub(v, accumulatedOffset)))
    reset()
  }, [accumulatedOffset, reset])
  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      // secondary mouse button only
      if (e.button === 2) {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - left + finderOffset[0]
        const y = e.clientY - top + finderOffset[1]
        rtree.insert({
          minX: x,
          minY: y,
          maxX: x + random(50, 100, false),
          maxY: y + random(50, 100, false),
          id: currentNodeId,
        } as TempRect)
        setCurrentNodeId(inc)
        const [[minX, minY], [maxX, maxY]] = scale([finderOffset, sum(finderOffset, finderDims)], 3)
        setData(rtree.search({ minX, minY, maxX, maxY }))
      }
      setDragging.off()
    },
    [currentNodeId, rtree, setDragging, finderOffset, finderDims]
  )

  useEffect(() => {
    const [[minX, minY], [maxX, maxY]] = scale([finderOffset, sum(finderOffset, finderDims)], 3)
    setData(rtree.search({ minX, minY, maxX, maxY }))
  }, [finderOffset, finderDims, rtree])

  return (
    <div
      className='absolute inset-0 overflow-hidden font-mono text-sm dark:text-slate-100 text-slate-800 dark:bg-slate-800 bg-slate-300'
      onContextMenuCapture={e => e.preventDefault()}>
      {/* canvas for nodes */}
      <div
        {...{ onPointerDown, onPointerMove, onPointerUp, onPointerUpCapture }}
        className='absolute overflow-hidden inset-4 dark:bg-slate-800 bg-slate-300 outline-slate-300 outline-offset-0 outline-dashed outline-1'>
        <div
          className='absolute inset-0 overflow-visible translate-x-[--x] translate-y-[--y]'
          style={{ "--x": `${accumulatedOffset[0] - finderOffset[0]}px`, "--y": `${accumulatedOffset[1] - finderOffset[1]}px` } as any}
          ref={finderRef}>
          {data.map(({ id, maxX, maxY, minX, minY }) => (
            <span
              className='cursor-pointer p-4 whitespace-nowrap flex items-center justify-center absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-slate-100 border-solid border-2 top-[--y] left-[--x]'
              style={{ "--x": `${minX}px`, "--y": `${minY}px` } as any}
              key={id}>
              <caption className='select-none'>node {id}</caption>
              <Connector />
              <Connector className='rotate-180 left-full' />
            </span>
          ))}
        </div>
      </div>
      {/* debugging information screen */}
      <div className='absolute flex flex-col p-4 rounded-lg pointer-events-none select-none top-4 left-4 dark:bg-slate-500 drop-shadow'>
        <span>
          nodes rendered: {data.length} out of {currentNodeId - 1}
        </span>
      </div>
      {/* buttons bar at the bottom of the screen */}
      <div className='absolute flex justify-center gap-2 -translate-x-1/2 bottom-4 left-1/2'>
        <Link tabIndex={-1} to='/'>
          <button
            type='button'
            className='relative items-center p-3 rounded-lg dark:bg-slate-500 focus:ring-2 hover:bg-slate-400 focus:z-10 drop-shadow'>
            <span className='sr-only'>Exit</span>
            <Squares2X2Icon className='w-5 h-5' aria-hidden='true' />
          </button>
        </Link>
        <div className='self-center w-1 h-1 rounded-full dark:bg-slate-500 grow-0' />
        <button
          type='button'
          className='relative items-center p-3 rounded-lg dark:bg-slate-500 focus:ring-2 hover:bg-slate-400 focus:z-10 drop-shadow'>
          <span className='sr-only'>Clear all</span>
          <TrashIcon className='w-5 h-5' aria-hidden='true' />
        </button>
        <div className='self-center w-1 h-1 rounded-full dark:bg-slate-500 grow-0' />
        <button
          type='button'
          className='relative items-center p-3 rounded-lg dark:bg-slate-500 focus:ring-2 hover:bg-slate-400 focus:z-10 drop-shadow'>
          <span className='sr-only'>New graph</span>
          <DocumentIcon className='w-5 h-5' aria-hidden='true' />
        </button>
        <button
          type='button'
          className='relative items-center p-3 rounded-lg dark:bg-slate-500 focus:ring-2 hover:bg-slate-400 focus:z-10 drop-shadow'>
          <span className='sr-only'>Open graph</span>
          <FolderOpenIcon className='w-5 h-5' aria-hidden='true' />
        </button>
      </div>
    </div>
  )
}

const Connector = ({ persist = false, className = "" }) => {
  return (
    <span
      className={`
      absolute left-0 top-1/2 w-16 h-16 -translate-y-1/2 -translate-x-1/2 cursor-pointer
      before:border-r-slate-100 before:border-t-slate-100 before:absolute before:content-[''] before:rounded-full
      before:border-l-slate-800 before:border-b-slate-800 before:rotate-45 before:border-solid before:border-2
      before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
      before:w-5 before:h-5 ${persist ? "" : "hover:before:scale-100 before:scale-0"} before:transition-transform before:dark:bg-slate-800
      ${persist ? "" : "after:opacity-0 hover:after:opacity-100"} after:transition-opacity
      after:content-[''] after:w-1 after:h-1 after:rounded-full after:dark:bg-slate-100 after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 ${className}`}
    />
  )
}
