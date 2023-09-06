/** @format */

import { isNil } from "ramda"
import { Pipe } from "../../../../pipe"

export type Codec<T> = [encode: (v: T) => string, decode: (v: string) => T]

export const backend = (back: Storage) => () => ({
  get: (ks: string[]) => ks.map(k => back.getItem(k)),
  set: (k: string, v: string) => back.setItem(k, v),
  remove: (ks: string[]) => ks.forEach(k => back.removeItem(k)),
  clear: () => back.clear(),
})

export const codec =
  <K, V>([ek]: Codec<K>, [ev, dv]: Codec<V>) =>
  (acc: ReturnType<ReturnType<typeof backend>>) => ({
    ...acc,
    get: (ks: K[]) => acc.get(ks.map(ek)).map(val => (isNil(val) ? null : dv(val))),
    set: (k: K, v: V) => acc.set(ek(k), ev(v)),
    remove: (ks: K[]) => acc.remove(ks.map(ek)),
  })

export default function storage<Fns extends ((arg: any) => any)[]>(...cnfs: Fns): ReturnType<Pipe<Fns>> {
  return cnfs.reduce((acc, v) => v(acc), null as never) as ReturnType<Pipe<Fns>>
}

type a = Pipe<
  [
    () => {
      get: (ks: string[]) => (string | null)[]
      set: (k: string, v: string) => void
      remove: (ks: string[]) => void
      clear: () => void
    }
  ]
>
