/** @format */

import React from "react"
import ReactDOM from "react-dom/client"
import { Outlet } from "react-router-dom"
import { DimensionsProvider } from "./domain/dimensions"
import { Provider as RoutingProvider } from "./domain/routing"
import "./index.css"
import compose from "./util/compose"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

const Multiprovider = compose(DimensionsProvider, RoutingProvider)

root.render(
  <React.StrictMode>
    <Multiprovider>
      <Outlet />
    </Multiprovider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
