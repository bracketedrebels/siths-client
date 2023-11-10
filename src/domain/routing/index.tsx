/** @format */

import { RouterProvider, createBrowserRouter } from "react-router-dom"
import Sandbox from "../../+Sandbox"
import SharedWorker from "../../+SharedWorker"
import Test from "../../App"
import Lobby from "../../Lobby"

const router = createBrowserRouter([
  {
    path: "/",
    Component: Lobby,
  },
  {
    path: "/sandbox",
    Component: Sandbox,
  },
  {
    path: "/sharedworker",
    Component: SharedWorker,
  },
  {
    path: "/experiment-app",
    Component: Test,
  },
])

export const Provider = () => <RouterProvider router={router} />
