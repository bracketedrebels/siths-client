/** @format */

import { Squares2X2Icon } from "@heroicons/react/20/solid"
import { random } from "lodash"
import { useCallback, useLayoutEffect, useState } from "react"
import { Link } from "react-router-dom"

const networking = new Worker(new URL("networking.worker.ts", import.meta.url), { type: "module", name: "Networker" })

export default function Page() {
  const [answer, setAnswer] = useState(undefined as undefined | number)
  const onMessage = useCallback((e: MessageEvent<number>) => setAnswer(e.data), [])
  const sendRandomMessage = useCallback(() => {
    const payload = random(20, 80, false)
    console.log(payload)
    networking.postMessage(payload)
  }, [])
  useLayoutEffect(() => {
    networking.addEventListener("message", onMessage)
    return () => networking.removeEventListener("message", onMessage)
  }, [onMessage])

  return (
    <div className='absolute inset-0 overflow-hidden font-mono text-sm dark:text-slate-100 text-slate-800 dark:bg-slate-800 bg-slate-300'>
      <div
        className='absolute flex items-center justify-center overflow-hidden inset-4 dark:bg-slate-800 bg-slate-300 outline-slate-300 outline-offset-0 outline-dashed outline-1'
        onClick={sendRandomMessage}>
        {answer || "Pending answer"}
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
      </div>
    </div>
  )
}
