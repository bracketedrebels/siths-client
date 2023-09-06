import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Test from "../../App";
import Lobby from "../../Lobby";
import Sandbox from "../../Sandbox";

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
    path: "/experiment-app",
    Component: Test,
  },
]);

export const Provider = () => <RouterProvider router={router} />;
