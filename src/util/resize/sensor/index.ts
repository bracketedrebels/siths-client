import { useMemo } from "react";

/**
 * Constructs ResizeObserver for you to use.
 *
 * @param callback to pass as an argument to observer
 * @returns ResizeObserver instace
 */
export const useInstance = (callback: ResizeObserverCallback) =>
  useMemo(() => new ResizeObserver(callback), [callback]);
