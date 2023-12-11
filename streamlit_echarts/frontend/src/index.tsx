import React from "react"
import ReactDOM from "react-dom/client"
import EchartsChart from "./EchartsChart"
import Test from "./Test"

import "./index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <EchartsChart />
    <Test />
  </>
)
