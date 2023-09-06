/** @format */

import { useEffect, useMemo, useState } from "react"
import { useBooleanState } from "../boolean"

const enum action {
  create,
  read,
  update,
  delete,
}
export type ActionCreate<T> = readonly [action.create, T]
export type ActionRead<T> = readonly [action.read, T]
export type ActionUpdate<T> = readonly [action.update, T]
export type ActionDelete<T> = readonly [action.delete, T]
export type Action<C, R, U, D> = ActionCreate<C> | ActionRead<R> | ActionUpdate<U> | ActionDelete<D>
export type Mutation<C, U, D> = ActionCreate<C> | ActionUpdate<U> | ActionDelete<D>

export type StoreUnderlay<C, R, U, D, Payload> = {
  create: (q: C) => Promise<void>
  update: (q: U) => Promise<void>
  read: (q: R, live?: boolean) => Promise<Payload>
  remove: (q: D) => Promise<void>
}

export default function store<C, R, U, D, Payload>({ create, remove, read, update }: StoreUnderlay<C, R, U, D, Payload>) {
  type Mut = Mutation<C, U, D>
  const useData = (query: R) => {
    const [fetching, setFetching] = useBooleanState(true)
    const [data, setData] = useState(undefined as undefined | Payload)
    useEffect(() => void read(query).then(setData).then(setFetching.off), [query])

    return useMemo(() => ({ fetching, data }), [fetching, data])
  }

  return { useData, create, remove, read, update }
}
