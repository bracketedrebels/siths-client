import { animationFrameScheduler, observeOn } from "rxjs";
import prepareUsage from "../../util/global/events";

export default prepareUsage(
  document,
  "pointermove",
  observeOn<PointerEvent>(animationFrameScheduler)
);
