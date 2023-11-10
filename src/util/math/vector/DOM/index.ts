/** @format */

import { PointerEvent as ReactPointerEvent } from "react"
import { Section, Vector, sub, sum } from "../index"

export const client = (e: PointerEvent | ReactPointerEvent) => [e.clientX, e.clientY] as Vector<2>
export const screen = (e: PointerEvent | ReactPointerEvent) => [e.screenX, e.screenY] as Vector<2>
export const movement = (e: PointerEvent | ReactPointerEvent) => [e.movementX, e.movementY] as Vector<2>
export const rect = (e: Element | DOMRect) =>
  (rect =>
    [
      [rect.left, rect.top],
      [rect.right, rect.bottom],
    ] as Section<2>)(e instanceof Element ? e.getBoundingClientRect() : e)
export const client2local = (v: Vector<2>, container: Element) => sub(v, rect(container)[0])
export const local2client = (v: Vector<2>, container: Element) => sum(v, rect(container)[0])
