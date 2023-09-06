const update = (appendix: string) => (acc: string) => `${acc} ${appendix}`;

/**
 *
 * @param dx
 * @param dy
 * @returns
 */
export const m = (dx: number, dy: number) => update(`m ${dx},${dy}`);

/**
 *
 * @param x
 * @param y
 * @returns
 */
export const M = (x: number, y: number) => update(`M ${x},${y}`);

/**
 *
 * @param dx
 * @param dy
 * @returns
 */
export const l = (dx: number, dy: number) => update(`l ${dx},${dy}`);

/**
 *
 * @param x
 * @param y
 * @returns
 */
export const L = (x: number, y: number) => update(`L ${x},${y}`);

/**
 *
 * @param dx
 * @returns
 */
export const h = (dx: number) => update(`h ${dx}`);

/**
 *
 * @param x
 * @param y
 * @returns
 */
export const H = (x: number, y: number) => update(`H ${x},${y}`);

/**
 *
 * @param dy
 * @returns
 */
export const v = (dy: number) => update(`v ${dy}`);

/**
 *
 * @param x
 * @param y
 * @returns
 */
export const V = (x: number, y: number) => update(`V ${x},${y}`);

/**
 *
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param x
 * @param y
 * @returns
 */
export const C = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number
) => update(`C ${x1},${y1} ${x2},${y2} ${x},${y}`);

/**
 *
 * @param dx1
 * @param dy1
 * @param dx2
 * @param dy2
 * @param dx
 * @param dy
 * @returns
 */
export const c = (
  dx1: number,
  dy1: number,
  dx2: number,
  dy2: number,
  dx: number,
  dy: number
) => update(`c ${dx1},${dy1} ${dx2},${dy2} ${dx},${dy}`);

/**
 *
 * @param x2
 * @param y2
 * @param x
 * @param y
 * @returns
 */
export const S = (x2: number, y2: number, x: number, y: number) =>
  update(`S ${x2},${y2} ${x},${y}`);

/**
 *
 * @param dx2
 * @param dy2
 * @param x
 * @param y
 * @returns
 */
export const s = (dx2: number, dy2: number, x: number, y: number) =>
  update(`V ${dx2},${dy2} ${x},${y}`);

/**
 *
 * @param x1
 * @param y1
 * @param x
 * @param y
 * @returns
 */
export const Q = (x1: number, y1: number, x: number, y: number) =>
  update(`Q ${x1},${y1} ${x},${y}`);

/**
 *
 * @param dx1
 * @param dy1
 * @param dx
 * @param dy
 * @returns
 */
export const q = (dx1: number, dy1: number, dx: number, dy: number) =>
  update(`q ${dx1},${dy1} ${dx},${dy}`);

/**
 *
 * @param x
 * @param y
 * @returns
 */
export const T = (x: number, y: number) => update(`T ${x},${y}`);

/**
 *
 * @param dx
 * @param dy
 * @returns
 */
export const t = (dx: number, dy: number) => update(`t ${dx},${dy}`);

/**
 *
 * @param rx
 * @param ry
 * @param angle
 * @param largearc
 * @param sweep
 * @param x
 * @param y
 * @returns
 */
export const A = (
  rx: number,
  ry: number,
  angle: number,
  largearc: 1 | 0,
  sweep: 1 | 0,
  x: number,
  y: number
) => update(`A ${rx} ${ry} ${angle} ${largearc} ${sweep} ${x},${y}`);

/**
 *
 * @param rx
 * @param ry
 * @param angle
 * @param largearc
 * @param sweep
 * @param dx
 * @param dy
 * @returns
 */
export const a = (
  rx: number,
  ry: number,
  angle: number,
  largearc: 1 | 0,
  sweep: 1 | 0,
  dx: number,
  dy: number
) => update(`a ${rx} ${ry} ${angle} ${largearc} ${sweep} ${dx},${dy}`);

export const z = () => update("z");
export const Z = () => update("Z");

export default function path(...cmds: Array<(v: string) => string>) {
  return cmds.reduce((acc, cmd) => cmd(acc), "");
}
