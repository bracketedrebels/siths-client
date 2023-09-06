/** @format */

import { StoreUnderlay } from "../.."

export type Backend<Payload, Index> = {
  get: (query: Index[]) => (Payload | null)[]
  set: (key: Index, value: Payload) => void
  remove: (query: Index[]) => void
  clear: () => void
}

export type AsyncBackend<Payload, Index> = {
  [K in keyof Backend<Payload, Index>]: (...args: Parameters<Backend<Payload, Index>[K]>) => Promise<ReturnType<Backend<Payload, Index>[K]>>
}

export default function keyvalue<Payload, Index extends string | number>(
  backend: Backend<Payload, Index>
): StoreUnderlay<[Index, Payload], Index[], [Index, Payload], Index[], (Payload | null)[]> {
  const updateOrCreate = ([k, v]: [k: Index, v: Payload]) => Promise.resolve(backend.set(k, v))
  const read = (q: Index[]) => Promise.resolve(backend.get(q))
  const remove = (q: Index[]) => Promise.resolve(backend.remove(q))

  return {
    create: updateOrCreate,
    update: updateOrCreate,
    read,
    remove,
  }
}
