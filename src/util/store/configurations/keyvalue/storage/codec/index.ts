/** @format */

import { Dictionary } from "lodash"
import { Codec } from "../index"

type JSON = null | number | string | boolean | JSON[] | Dictionary<JSON>

export const JSONCodec = (reviver?: Parameters<typeof JSON.parse>["1"]) =>
  [(v: JSON) => JSON.stringify(v, null, 0), (v: string) => JSON.parse(v, reviver) as JSON] as Codec<JSON>

export const decimalCodec = (radix = 10) => [(v: number) => v.toString(radix), (v: string) => Number.parseInt(v, radix)] as Codec<number>
