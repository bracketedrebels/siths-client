/** @format */

import H, { N } from "hotscript"

type PipeTypes<Fns extends ((arg: any) => any)[], In> = Fns extends [infer F extends (arg: any) => any, ...infer Rest]
  ? In extends Parameters<F>[0]
    ? Rest extends [(arg: any) => any, ...any[]]
      ? [Parameters<F>[0], ...PipeTypes<Rest, ReturnType<F>>]
      : [Parameters<F>[0], ReturnType<F>]
    : []
  : []

export type Pipe<Fns extends ((arg: any) => any)[], Init = Parameters<Fns[0]>[0]> = Fns["length"] extends infer L extends number
  ? PipeTypes<Fns, Init>["length"] extends infer PL extends number
    ? H.Pipe<L, [N.Add<1>, N.Equal<PL>]> extends true
      ? (v: PipeTypes<Fns, Init>[0]) => PipeTypes<Fns, Init>[L]
      : never
    : never
  : never
