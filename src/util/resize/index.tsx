import { noop } from 'lodash/fp';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useInstance } from "./sensor";

const mode2key = <T extends ResizeObserverBoxOptions>(v: T) => v === 'border-box'
  ? 'borderBoxSize' as const
  : v === 'content-box'
  ? 'contentBoxSize' as const
  : 'devicePixelContentBoxSize' as const;

/**
 * @todo docs
 */
export type Cycle<P, C> = {
  mode: ResizeObserverBoxOptions,
  provide: (curr: ResizeObserverEntry[]) => (prev?: P) => P,
  consume: (curr: P) => (target: Element | SVGElement) => C,
}

/**
 * @todo docs
 * @param mode 
 * @returns 
 */
export const defaultCycleFactory = (mode: ResizeObserverBoxOptions) => ({
  mode,
  provide: (curr: ResizeObserverEntry[]) =>
    (prev?: Map<Element | SVGElement, readonly [inlineSize: number, blockSize: number]>) => curr
      .reduce((acc, item) => acc
        .set(item.target, (v => [v.inlineSize, v.blockSize] as const)(item[mode2key(mode)][0])), prev ? new Map(prev) : new Map()),
  consume: (v: Map<Element | SVGElement, readonly [inlineSize: number, blockSize: number]>) => (target: Element | SVGElement) => v.get(target)
}) as Cycle<Map<Element | SVGElement, readonly [inlineSize: number, blockSize: number]>, readonly [inlineSize: number, blockSize: number]>

/**
 * @todo docs
 */
export const defaultCycle = defaultCycleFactory('border-box')

/**
 * @todo docs and example
 * @param cycle 
 * @returns 
 */
export const prepareUsage = <P, C>(cycle: Cycle<P, C>) => {
  const init = cycle.provide([])();
  const contextMap = createContext(init);
  const contextSensor = createContext(null as null | ResizeObserver);

  /**
   * Resize values provider
   * @param param0 
   * @returns 
   */
  const Provider = ({ children = null as ReactNode }) => {
    const [entries, setEntries] = useState(init);
    const listener = useCallback((items: ResizeObserverEntry[]) => setEntries(cycle.provide(items)), [])
    const sensor = useInstance(listener);
    return (
      <contextSensor.Provider value={sensor}>
        <contextMap.Provider value={entries}>
          { children }
        </contextMap.Provider>
      </contextSensor.Provider>
    )
  }

  /**
   * Given target this hook will track target size
   * every time size is changed.
   * @param target 
   */
  function useIt(target: null): null;
  function useIt(target: Element | SVGElement): C;
  function useIt(target: Element | SVGElement | null): C | null;
  function useIt<R extends Element | SVGElement | null>(target: R) {
    const sensor = useContext(contextSensor);
    const entriesMap = useContext(contextMap);
    const [state, setState] = useState(target ? cycle.consume(init)(target) : null);
    useEffect(() => {
      if (sensor && target) {
        sensor.observe(target, { box: cycle.mode })
        return () => sensor.unobserve(target);
      }
    }, [ sensor, target ]);
    useEffect(() => target ? setState(cycle.consume(entriesMap)(target)) : noop(), [ target, entriesMap ]);

    return state;
  }

  return [Provider, useIt] as const;
}
