/** @format */

import { DocumentIcon, FolderOpenIcon, Squares2X2Icon, TrashIcon } from "@heroicons/react/20/solid"
import { throttle } from "lodash"
import RBush from "rbush"
import { HTMLProps, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Section, Vector, equal, scale, sum, vector } from "../util/math/vector"
import { client, client2local } from "../util/math/vector/DOM"

import useGlobalPointerCancel from "../domain/pointercancel"
import useGlobalPointerLeave from "../domain/pointerleave"
import useGlobalPointerMove from "../domain/pointermove"
import useGlobalPointerUp from "../domain/pointerup"

const enum recttype {
  edge,
  node,
}

type TempRect = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: number
  type: recttype
}

const zeroOffset = vector(2, 0)
const edgeSense = 10
// const positiveQuater = [vector(2, 0), vector(2, Infinity)] as const

export default function Page() {
  const rtree = useMemo(() => new RBush<TempRect>(), [])
  const [identifier, setIdentifier] = useState(1)
  const [positionDragStart, setPositionDragStart] = useState(undefined as undefined | Vector<2>)
  const [positionComplete, setPositionComplete] = useState(undefined as undefined | Vector<2>)
  const [positionPointer, setPositionPointer] = useState(undefined as undefined | Vector<2>)

  const finderRef = useRef<HTMLDivElement>(null)
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      setPositionPointer(prev =>
        finderRef.current ? (next => (prev && equal(next, prev) ? prev : next))(client2local(client(e), finderRef.current)) : prev
      )
    },
    [finderRef]
  )

  useGlobalPointerMove(onPointerMove)
  const onPointerCancelOrLeave = useCallback(() => setPositionPointer(undefined), [])
  useGlobalPointerCancel(onPointerCancelOrLeave)
  useGlobalPointerLeave(onPointerCancelOrLeave)
  const onPointerUp = useCallback((e: PointerEvent) => {
    const { currentTarget } = e
    if (currentTarget) {
      const localEventCoordinate = client2local(client(e), currentTarget as Element)
      if (localEventCoordinate) setPositionComplete(localEventCoordinate)
    }
  }, [])
  useGlobalPointerUp(onPointerUp)

  const [finderOffset, setFinderOffset] = useState(zeroOffset)
  const [finderDims, setFinderDims] = useState(zeroOffset)
  const resizeSensor = useMemo(
    () =>
      new ResizeObserver(
        throttle(
          v => {
            const dim = [v[0].contentBoxSize[0].inlineSize, v[0].contentBoxSize[0].blockSize] as Vector<2>
            setFinderDims(dim)
          },
          250,
          { leading: false }
        )
      ),
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

  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const { currentTarget } = e
    if (currentTarget) {
      const localEventCoordinate = client2local(client(e), currentTarget)
      // primary mouse button only
      if (localEventCoordinate && e.buttons === 1) {
        setPositionDragStart(localEventCoordinate)
      }
    }
  }, [])

  const pickData = useCallback(
    ([offset, dims]: Section<2>) => {
      const [[minX, minY], [maxX, maxY]] = scale([offset, sum(offset, dims)], 3)
      setData(rtree.search({ minX, minY, maxX, maxY }))
    },
    [rtree]
  )
  const throttledPickData = useMemo(() => throttle(pickData, 250, { leading: false }), [pickData])

  useEffect(() => {
    if (positionComplete) {
      setPositionComplete(undefined)
      setPositionDragStart(undefined)
    }
    throttledPickData([finderOffset, finderDims])
  }, [positionComplete, positionDragStart, positionPointer, finderOffset, finderDims, rtree, setFinderOffset, identifier])

  return (
    <div
      className='absolute inset-0 overflow-hidden font-mono text-sm dark:text-slate-100 text-slate-800 dark:bg-slate-800 bg-slate-300'
      onContextMenuCapture={e => e.preventDefault()}>
      {/* canvas for nodes */}
      <div
        onPointerDown={onCanvasPointerDown}
        className='absolute overflow-hidden inset-4 dark:bg-slate-800 bg-slate-300 outline-slate-300 outline-offset-0 outline-dashed outline-1'>
        <div
          className='absolute inset-0 overflow-visible translate-x-[--x] translate-y-[--y]'
          style={{ "--x": `${0 - finderOffset[0]}px`, "--y": `${0 - finderOffset[1]}px` } as any}
          ref={finderRef}>
          {data.map(({ id, type, minX, minY }) =>
            type === recttype.node ? (
              <span
                className='cursor-pointer p-4 whitespace-nowrap flex items-center justify-center absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-slate-100 border-solid border-2 top-[--y] left-[--x]'
                style={{ "--x": `${minX}px`, "--y": `${minY}px` } as any}
                key={id}>
                <caption className='select-none'>node {id}</caption>
                <Connector persist />
                <Connector persist className='rotate-180 left-full' />
              </span>
            ) : null
          )}
        </div>
      </div>
      {/* debugging information screen */}
      <div className='absolute flex flex-col p-4 rounded-lg pointer-events-none select-none top-4 left-4 dark:bg-slate-500 drop-shadow'>
        <span>
          nodes rendered: {data.length} out of {identifier - 1}
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

const Connector = ({ persist = false, className = "", ...rest }: HTMLProps<HTMLSpanElement> & { persist?: boolean }) => {
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
      {...rest}
    />
  )
}
