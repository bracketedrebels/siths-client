/** @format */

import { add, subtract } from "lodash"
import { gt, gte, lt, lte, max, min, multiply, zipWith } from "ramda"
import { N } from "ts-toolbelt"

export const pointInBox = <V extends readonly number[]>(point: V, [a, b]: [V, V], strict = false) => {
  const less = strict ? lt : lte
  const greater = strict ? gt : gte
  return point.reduce((acc: boolean, v: number, i: number) => acc && greater(v, a[i]) && less(v, b[i]), true) as boolean
}

export const boxesIntersect = <V extends readonly number[]>([a, b]: [V, V], [c, d]: [V, V], strict = false) => {
  // in order to cover edge case when one box includes another one
  // we consider one box as an intersection of two subspaces and
  // then will detect if two points are in that boxes
  const upperSubspace = [vector(d.length, Number.POSITIVE_INFINITY) as unknown as V, d] as [V, V]
  const lowerSubspace = [c, vector(c.length, Number.POSITIVE_INFINITY) as unknown as V] as [V, V]
  return pointInBox(a, upperSubspace, strict) && pointInBox(b, lowerSubspace, strict)
}

export const fold = <V extends readonly number[]>(fn: (a: number, b: number) => number, [first, ...rest]: [V, ...V[]]) =>
  rest.reduce((acc, v) => zipWith(fn, acc, v) as unknown as V, first) as unknown as V

export const sum = <V extends readonly number[]>(...v: [V, ...V[]]) => fold(add, v)

export const mul = <V extends readonly number[]>(a: V, f: number) => a.map(multiply(f)) as unknown as V

export const sub = <V extends readonly number[]>(...v: [V, ...V[]]) => fold(subtract, v)

export const vector = <Len extends number>(len: Len, fill = 0) => new Array(len).fill(fill) as unknown as Vector<Len>

export const scale = <V extends readonly number[]>([a, b]: [V, V], f: number) =>
  (delta => [sub(a, delta), sum(b, delta)] as [V, V])(mul(sub(b, a), (f - 1) / 2))

export const clamp = <V extends readonly number[]>([mn, mx]: readonly [V, V], v: V) => fold(min, [fold(max, [v, mn]), mx])

export type PlainVector<Len extends number> = N.Greater<Len, 0> extends 1 ? readonly [number, ...PlainVector<N.Sub<Len, 1>>] : readonly []
export type Vector<Len extends number> = PlainVector<Len> & { length: Len } & readonly number[]
