/** @format */

import {
  BehaviorSubject,
  Subject,
  combineLatest,
  first,
  from,
  scan,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from "rxjs"

import { useCallback } from "react"

import { Bindings } from "@rdfjs/types"
import { Quad } from "quadstore"

import type {
  AllMetadataSupport,
  Query,
  QueryBindings,
  QueryBoolean,
  QueryQuads,
  QueryVoid,
} from "@rdfjs/types"
import { isEmpty } from "lodash"
import { join, zipWith } from "lodash/fp"
import { MemoryLevel } from "memory-level"
import { Quadstore } from "quadstore"
import { Engine, StringContext } from "quadstore-comunica"
import { DataFactory } from "rdf-data-factory"
import { Observable } from "rxjs"
import {
  Exact,
  ExactWithPayload,
  SimplifiedTripleQuery,
  isExact,
} from "./query"

export type DBI = Awaited<ReturnType<typeof create>>
export type DBIWithPayload<N, E = N> = DBI & {
  payload: { nodes: Record<Exact, N>; edges: Record<string, E> }
}
export type Atom = string | number

export const create = () => {
  const backend = new MemoryLevel()
  const factory = new DataFactory()
  const store = new Quadstore({
    backend,
    dataFactory: factory,
  })
  const engine = new Engine(store)

  return store
    .open()
    .then(() => store.clear())
    .then(() => ({ backend, factory, store, engine }))
}

export const isBoolean = <T,>(v: Query<T>): v is QueryBoolean =>
  v.resultType === "boolean"
export const isVoid = <T,>(v: Query<T>): v is QueryVoid =>
  v.resultType === "boolean"
export const isQuads = <T,>(v: Query<T>): v is QueryQuads<T> =>
  v.resultType === "boolean"
export const isBindings = <T,>(
  v: Query<AllMetadataSupport>
): v is QueryBindings<T> => v.resultType === "boolean"

export const queryVoid = (q: string, ctx?: StringContext) => (dbi: DBI) =>
  from(dbi.engine.queryVoid(q, ctx))

export const queryBoolean = (q: string, ctx?: StringContext) => (dbi: DBI) =>
  from(dbi.engine.queryBoolean(q, ctx))

export const queryQuads = (q: string, ctx?: StringContext) => (dbi: DBI) =>
  from(dbi.engine.queryQuads(q, ctx)).pipe(
    switchMap(
      stream =>
        new Observable(observer => {
          stream.on("data", val => observer.next(val))
          stream.on("error", err => observer.error(err))
          stream.on("end", () => observer.complete())
        }) as Observable<Quad>
    )
  )

export const queryBindings = (q: string, ctx?: StringContext) => (dbi: DBI) =>
  from(dbi.engine.queryBindings(q, ctx)).pipe(
    switchMap(
      stream =>
        new Observable(observer => {
          stream.on("data", val => observer.next(val))
          stream.on("error", err => observer.error(err))
          stream.on("end", () => observer.complete())
        }) as Observable<Bindings>
    )
  )

const enum action {
  put,
  delete,
}
type ActionPut<N = any, E = N> = [
  action: action.put,
  quads: [
    s: Exact | ExactWithPayload<N>,
    p: Exact | ExactWithPayload<E>,
    o: Exact | ExactWithPayload<N>
  ][]
]
type ActionDelete = [action: action.delete, pattern: SimplifiedTripleQuery]
type Action<N = any, E = N> = ActionPut<N, E> | ActionDelete

export default <N = never, E = N>(
  init4nodes = {} as Record<Exact, N>,
  init4edges = {} as Record<string, E>
) => {
  const db$ = from(create())
  const action$ = new Subject<Action<N, E>>()
  const queries$ = new BehaviorSubject([] as SimplifiedTripleQuery[])

  const init4pld = { nodes: init4nodes, edges: init4edges }
  db$.subscribe(({ store }) => store.db.on("batch", console.log))
  const payload$ = action$.pipe(
    scan(
      (acc, [act, pld]) =>
        act === action.put
          ? (({ nodes, edges }) =>
              isEmpty(nodes) && isEmpty(edges)
                ? acc
                : isEmpty(nodes)
                ? { ...acc, edges: { ...acc.edges, ...edges } }
                : { ...acc, nodes: { ...acc.nodes, ...nodes } })(
              pld.reduce(
                (acc1, [s, p, o]) =>
                  isExact(s) && isExact(p) && isExact(o)
                    ? acc1
                    : isExact(p)
                    ? {
                        ...acc1,
                        nodes: {
                          ...acc1.nodes,
                          ...(!isExact(s) ? { [s[0]]: s[1] } : {}),
                          ...(!isExact(o) ? { [o[0]]: o[1] } : {}),
                        },
                      }
                    : {
                        ...acc1,
                        ...(isExact(s) && isExact(o)
                          ? {
                              edges: {
                                ...acc1.edges,
                                [`${s}-${p}>${o}`]: p[1],
                              },
                            }
                          : {}),
                        ...(isExact(s) && !isExact(o)
                          ? {
                              edges: {
                                ...acc1.edges,
                                [`${s}-${p}>${o[0]}`]: p[1],
                              },
                              nodes: { ...acc1.nodes, [o[0]]: o[1] },
                            }
                          : {}),
                        ...(!isExact(s) && isExact(o)
                          ? {
                              edges: {
                                ...acc1.edges,
                                [`${s[0]}-${p}>${o}`]: p[1],
                              },
                              nodes: { ...acc1.nodes, [s[0]]: s[1] },
                            }
                          : {}),
                        ...(!isExact(s) && !isExact(o)
                          ? {
                              edges: {
                                ...acc1.edges,
                                [`${s[0]}-${p}>${o[0]}`]: p[1],
                              },
                              nodes: {
                                ...acc1.nodes,
                                [s[0]]: s[1],
                                [o[0]]: o[1],
                              },
                            }
                          : {}),
                      },
                init4pld
              )
            )
          : acc,
      init4pld
    ),
    shareReplay(1),
    startWith(init4pld)
  )

  // const Provider = ({ children = null as ReactNode }) => {
  //   const [state, setState] = useState(payloadsInitialValue)
  //   useEffect(() => {
  //     const subscription = payloads$.subscribe(setState)
  //     subscription.add(
  //       combineLatest([
  //         db$,
  //         action$.pipe(
  //           filter((v): v is ActionPut<T> => v[0] === action.put),
  //           map(v => v[1])
  //         ),
  //       ])
  //         .pipe(
  //           switchMap(([db, quads]) =>
  //             db.store
  //               .multiPut(
  //                 quads.map((s, p, o) =>
  //                   db.factory.quad(
  //                     db.factory.namedNode(toString(s)),
  //                     db.factory.namedNode(toString(p)),
  //                     db.factory.namedNode(toString(o))
  //                   )
  //                 )
  //               )
  //               .then(() => quads)
  //           )
  //         )
  //         .subscribe(quads =>
  //           payloads$.next(
  //             quads.reduce(
  //               (acc, [s, p, o, pld]) =>
  //                 isNil(pld) ? acc : { ...acc, [`${s}|${p}|${o}`]: pld },
  //               {}
  //             )
  //           )
  //         )
  //     )
  //     subscription.add(
  //       payloads$
  //         .pipe(scan((acc, v) => ({ ...acc, ...v }), payloadsInitialValue))
  //         .subscribe(setState)
  //     )
  //     return () => subscription.unsubscribe()
  //   }, [])
  //   return <context.Provider value={state}>{children}</context.Provider>
  // }

  const useDBIAction = <T, U extends any[]>(
    cb: (...pld: U) => (v: DBIWithPayload<N, E>) => Promise<T>
  ) =>
    useCallback(
      (...v: U) =>
        combineLatest([db$, payload$]).pipe(
          first(),
          tap(v => console.log(v)),
          switchMap(([db, payload]) =>
            cb(...v)({
              ...db,
              payload,
            })
          )
        ),
      [cb]
    )

  const useBooleanQuery = () =>
    useCallback(
      (...args: Parameters<typeof queryBoolean>) =>
        db$.pipe(switchMap(queryBoolean(...args))),
      []
    )

  const useVoidQuery = () =>
    useCallback(
      (...args: Parameters<typeof queryVoid>) =>
        db$.pipe(switchMap(queryVoid(...args))),
      []
    )

  const useQuadsQuery = () =>
    useCallback(
      (...args: Parameters<typeof queryQuads>) =>
        db$.pipe(switchMap(queryQuads(...args))),
      []
    )

  const useBindingsQuery = () =>
    useCallback(
      (...args: Parameters<typeof queryBindings>) =>
        db$.pipe(switchMap(queryBindings(...args))),
      []
    )

  // const useQuads = (query: string) => {
  //   const queryQuads = useQuadsQuery()
  //   const ctx = useContext(context)
  //   const thread = useMemo(() => queryQuads(query), [query])
  //   const [quads, setQuads] = useState([] as Quad[])
  //   useEffect(() => {
  //     const sub = thread.subscribe(q => setQuads(prev => [...prev, q]))
  //     return () => sub.unsubscribe()
  //   }, [thread])
  //   return useMemo(() => [quads, ctx] as const, [quads, ctx])
  // }

  // const useBindings = (query: string) => {
  //   const queryBindings = useBindingsQuery()
  //   const ctx = useContext(context)
  //   const thread = useMemo(() => queryBindings(query), [query])
  //   const [bindings, setBindings] = useState<Bindings | undefined>()
  //   useEffect(() => {
  //     const sub = thread.subscribe(q =>
  //       setBindings(prev => (prev ? q.merge(prev) : q))
  //     )
  //     return () => sub.unsubscribe()
  //   }, [thread])
  //   return useMemo(() => [bindings, ctx] as const, [bindings, ctx])
  // }

  const useInsert = () => {}

  return {
    // Provider,
    useDBIAction,
    // useQuads,
    // useBindings,
    useVoidQuery,
    useQuadsQuery,
    useBooleanQuery,
  }
}

export const sparql = (
  [start, ...rest]: TemplateStringsArray,
  ...placeholders: (string | number)[]
) => start + zipWith(join(""))(rest, placeholders)
