import { useEffect } from "react";
import { fromEvent, Observable, UnaryFunction } from "rxjs";

type EventTarget2EventMap<T extends EventTarget> = T extends Document
  ? DocumentEventMap
  : T extends Window
  ? WindowEventMap
  : GlobalEventHandlersEventMap;

const defaultOptions = {
  capture: false,
  passive: false,
};

/**
 *
 * @param target
 * @param event
 * @param options
 * @returns
 */
const prepareUsage = <
  T extends EventTarget,
  O,
  K extends keyof EventTarget2EventMap<T>,
  E extends Event
>(
  target: T,
  event: K,
  pipe: UnaryFunction<Observable<E>, Observable<O>>,
  options = defaultOptions as Partial<typeof defaultOptions>
) => {
  const { capture, passive, once = false } = { ...defaultOptions, ...options };
  const thread = fromEvent<E>(target, event as string, {
    once,
    capture,
    passive,
  }).pipe(pipe);

  return (listener: (v: O) => void) => {
    useEffect(() => {
      const subscription = thread.subscribe(listener);

      // setting timeout in order for not to trigger
      // constant resubscription to observer in case there is
      // a single listener. Otherwise, amount of listeners
      // will be constantly changing between 0 and 1
      // and this will lead to performance penalities
      //
      // This solution is the dirty one. But
      // the first that came to my mind. Any clean
      // ways of handling the situation are welcome.
      return () => void setTimeout(() => subscription.unsubscribe(), 0);
    }, [listener]);
  };
};

export default prepareUsage;
