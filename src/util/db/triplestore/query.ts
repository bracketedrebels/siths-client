/** @format */

import { isNil, isNumber, isString } from "lodash/fp"
import { Quad } from "quadstore"
import { and } from "ramda"
import { DataFactory, DefaultGraph } from "rdf-data-factory"

export type Variable = string
export type Exact = number
export type ExactWithPayload<T> = [Exact, T]
export type Triple = [Exact, Exact, Exact]
export type SimplifiedTripleQuery = [
  subject: Variable | Exact | SimplifiedTripleQuery,
  predicate: Variable | Exact,
  object: Variable | Exact | SimplifiedTripleQuery
]

export type SimplifiedTripleQueryPlain = [
  subject: Variable | Exact,
  predicate: Variable | Exact,
  object: Variable | Exact
]

export const isExact = (v: any): v is Exact => isNumber(v)
export const isVariable = (v: any): v is Variable => isString(v)
export const isQuery = (
  v: Variable | Exact | SimplifiedTripleQuery
): v is SimplifiedTripleQuery => !isExact(v) && !isVariable(v)

export const simplified2internal = (factory: DataFactory) =>
  function recursive([s, p, o]:
    | SimplifiedTripleQuery
    | SimplifiedTripleQueryPlain): Quad {
    return factory.quad(
      isString(s) || isNil(s)
        ? factory.variable(s)
        : isNumber(s)
        ? factory.namedNode(`${s}`)
        : recursive(s),
      isString(p) || isNil(p) ? factory.variable(p) : factory.namedNode(`${o}`),
      isString(o) || isNil(o)
        ? factory.variable(o)
        : isNumber(o)
        ? factory.namedNode(`${o}`)
        : recursive(o),
      DefaultGraph.INSTANCE
    )
  }

export const plainify = function recursive(
  q: SimplifiedTripleQuery
): SimplifiedTripleQueryPlain[] {
  return isQuery(q[0]) || isQuery(q[2])
    ? isQuery(q[0])
      ? isQuery(q[2])
        ? [
            ...recursive(q[0]),
            [q[0][2], q[1], q[2][0]] as SimplifiedTripleQueryPlain,
            ...recursive(q[2]),
          ]
        : [
            ...recursive(q[0]),
            [q[0][2], q[1], q[2]] as SimplifiedTripleQueryPlain,
          ]
      : isQuery(q[2])
      ? [
          [q[0], q[1], q[2][0]] as SimplifiedTripleQueryPlain,
          ...recursive(q[2]),
        ]
      : ([q] as SimplifiedTripleQueryPlain[])
    : ([q] as SimplifiedTripleQueryPlain[])
}

export const satisfiesPlain =
  ([a, b, c]: Triple) =>
  ([s, p, o]: SimplifiedTripleQueryPlain) =>
    isExact(s)
      ? isExact(p)
        ? isExact(o)
          ? a === s && b === p && c === o
          : a === s && b === p
        : isExact(o)
        ? a === s && c === o
        : p === o
        ? a === s && b === c
        : a === s
      : isExact(p)
      ? isExact(o)
        ? b === p && c === o
        : s === o
        ? b === p && a === c
        : b === p
      : isExact(o)
      ? s === p
        ? o === c && a === b
        : o === c
      : false ||
        (s === p && p === o && a === b && b === c) ||
        (s === o && a === c) ||
        (s === p && a === b) ||
        (p === o && b === c) ||
        true

export const satisfactionSituation =
  (triple: Triple) => (query: SimplifiedTripleQuery) =>
    plainify(query).map(satisfiesPlain(triple))

export const satisfies = (triple: Triple) => (query: SimplifiedTripleQuery) =>
  satisfactionSituation(triple)(query).reduce(and)
