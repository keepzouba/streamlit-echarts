import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"
import { isObject } from "lodash"

import * as echarts from "echarts"
import "echarts-gl"
import "echarts-liquidfill"
import "echarts-wordcloud"
import ReactEcharts, { EChartsOption } from "echarts-for-react"

import deepMap from "./utils"

interface Map {
  mapName: string
  geoJson: object
  specialAreas: object
}

/**
 * Arguments Streamlit receives from the Python side
 */
interface PythonArgs {
  options: EChartsOption
  theme: string | object
  onEvents: any
  height: string
  width: string
  renderer: "canvas" | "svg"
  map: Map
}

const EchartsChart = (props: ComponentProps) => {
  const echartsElementRef = useRef<ReactEcharts>(null)
  const echartsInstanceRef = useRef<echarts.EChartsType | null>(null)
  const JS_PLACEHOLDER = "--x_x--0_0--"

  const registerTheme = (themeProp: string | object) => {
    const customThemeName = "custom_theme"
    if (isObject(themeProp)) {
      echarts.registerTheme(customThemeName, themeProp)
    }
    return isObject(themeProp) ? customThemeName : themeProp
  }

  /**
   * If string can be evaluated as a Function, return activated function. Else return string.
   * @param s string to evaluate to function
   * @returns Function if can be evaluated as one, else input string
   */
  const evalStringToFunction = (s: string) => {
    let funcReg = new RegExp(
      `${JS_PLACEHOLDER}\\s*(function\\s*.*)\\s*${JS_PLACEHOLDER}`
    )
    let match = funcReg.exec(s)
    if (match) {
      const funcStr = match[1]
      return new Function("return " + funcStr)()
    } else {
      return s
    }
  }

  /**
   * Deep map all values in an object to evaluate all strings as functions
   * We use this to look in all nested values of options for Pyecharts Javascript placeholder
   * @param obj object to deep map on
   * @returns object with all functions in values evaluated
   */
  const evalStringToFunctionDeepMap = (obj: object) => {
    return deepMap(obj, evalStringToFunction, {})
  }

  const {
    options,
    theme,
    onEvents = [],
    height,
    width,
    renderer,
    map,
  }: PythonArgs = props.args

  console.log("options", options)

  const cleanTheme = registerTheme(theme)

  if (isObject(map)) {
    echarts.registerMap(map.mapName, map.geoJson, map.specialAreas)
  }

  const handlerCleanOptions = (options: any) => {
    // 将options中字符串为'true'和'false' 的数据转换成布尔值

    // console.log("handlerCleanOptions", options)

    // 遍历options
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        const element = options[key]

        // 如果是字符串
        if (typeof element === "string") {
          // 如果是'true'，转换成布尔值true
          if (element === "true") {
            options[key] = true
          }

          // 如果是'false'，转换成布尔值false
          if (element === "false") {
            options[key] = false
          }
        }

        // 如果是数组，递归调用
        if (Array.isArray(element)) {
          options[key] = handlerCleanOptions(element)
        }

        // 如果是对象，递归调用
        if (typeof element === "object") {
          options[key] = handlerCleanOptions(element)
        }
      }
    }

    return options
  }

  // no need for memo, react-echarts uses fast-deep-equal to compare option/event change and update on change
  const cleanOptions = handlerCleanOptions(evalStringToFunctionDeepMap(options))
  const cache = useRef<any>(cleanOptions)

  // const [cache, setCache] = useState<any>(cleanOptions)

  const cleanOnEvents: any = {}
  const eventKeys = Object.keys(onEvents)
  console.log("cleanOptions", cleanOptions)

  // const eventFunctions = Object.values(onEvents);
  // let callbacks: any[] = [];

  // eventFunctions.forEach((eventFunction, index) => {
  //   /* eslint-disable-next-line */
  //   callbacks[index] = useCallback(
  //     (params: any) => {
  //       const s = evalStringToFunction(eventFunction as string)(params)
  //       Streamlit.setComponentValue(s)
  //     },
  //     [eventFunction]
  //   );
  // });

  // eventKeys.forEach((key: string, index: number) => {
  //   cleanOnEvents[key] = callbacks[index];
  // });
  eventKeys.map((key: string) => {
    const eventFunction = onEvents[key]
    /* eslint-disable-next-line */
    cleanOnEvents[key] = useCallback(
      (params: any) => {
        const s = evalStringToFunction(eventFunction)(params)
        // Streamlit.setComponentValue(s)
      },
      [eventFunction]
    )
    // cleanOnEvents[key] = (params: any) => {
    //   const s = evalStringToFunction(eventFunction)(params)
    //   Streamlit.setComponentValue(s)
    // }
  })

  // 监听图表的dataZoom事件
  const onZoom = useCallback(
    (params: any) => {
      console.log("onZoom", params)
      drawGraphic(cleanOptions)
    },
    [cleanOptions]
  )

  cleanOnEvents["dataZoom"] = onZoom

  useEffect(() => {
    if (null === echartsElementRef.current) {
      return
    }

    echartsInstanceRef.current = echartsElementRef.current.getEchartsInstance()
  })

  const onPointDragging = useCallback(
    (origin: { dataIndex: any; seriesIndex: any; position: any }) => {
      const myChart = echartsInstanceRef.current

      const dataIndex = origin.dataIndex
      const seriesIndex = origin.seriesIndex

      const series = options.series

      const pos = myChart?.convertFromPixel(
        {
          seriesIndex: seriesIndex,
        },
        origin.position
      )

      series[seriesIndex].data[dataIndex] = pos

      // 用更新后的 data，重绘折线图。
      myChart?.setOption({
        series: series,
      })

      const op = cache.current

      op.series[seriesIndex].data[dataIndex] = [
        ...series[seriesIndex].data[dataIndex],
        op.series[seriesIndex].data[dataIndex][2],
      ]
      // cache.current = op
    },
    []
  )

  const drawGraphic = useCallback(
    (options: { series: any }) => {
      console.log("drawGraphic", options)

      // 根据cleanOptions中的series的数组长度，判断有几条折线,根据每条折线的数据长度，判断有几个点,给每个点添加拖拽事件

      const series = options.series

      const graphic: any[] = []

      const myChart = echartsInstanceRef.current

      // 必须是type为line的series

      setTimeout(() => {
        if (Array.isArray(series)) {
          series.forEach((item1, index1) => {
            if (Array.isArray(item1.data)) {
              if (item1.type === "line") {
                item1.data.forEach((item2: any, index2: any) => {
                  const position = myChart?.convertToPixel(
                    {
                      seriesIndex: index1,
                    },
                    item2
                  )

                  // console.log("position", position, item2)

                  // 绘制可以拖拽的点
                  graphic.push({
                    type: "circle",
                    position: position,
                    id: "circle-seriesIndex" + index1 + "-dataIndex" + index2,
                    shape: {
                      cx: 0,
                      cy: 0,
                      r: item1.symbolSize,
                    },
                    style: {
                      fill: item1.itemStyle.color,
                      opacity: item1.itemStyle.opacity,
                    },
                    // invisible: true,
                    draggable: "vertical",

                    ondrag: function (dx: any, dy: any) {
                      onPointDragging({
                        dataIndex: index2,
                        seriesIndex: index1,
                        position: [this.x, this.y],
                      })
                    },

                    onmousemove: function (dx: any, dy: any) {
                      console.log("onmousemove")

                      // myChart?.dispatchAction({
                      //   type: "showTip",
                      //   seriesIndex: 0,
                      //   dataIndex: index2,
                      // })
                    },

                    ondragend: function (dx: any, dy: any) {
                      // 对比前后的数据，如果有变化，就更新
                      const prePos = position

                      const curPos = [this.x, this.y]

                      // console.log("prePos", prePos, "curPos", curPos)

                      console.log("cache.current", cache.current)

                      // 只需要对比y轴数据的变化
                      if (prePos && prePos[1] === curPos[1]) return

                      const new_series = cache.current.series

                      Streamlit.setComponentValue(new_series)
                    },

                    z: 100,
                  })

                  // 绘制一个一个原点,表示初始位置
                  graphic.push({
                    type: "circle",
                    position: position,
                    id:
                      "circle-seriesIndex" +
                      index1 +
                      "-dataIndex" +
                      index2 +
                      "origin",
                    shape: {
                      cx: 0,
                      cy: 0,
                      r: item1.originSymbolSize,
                    },
                    style: {
                      fill: item1.originItemStyle.color,
                      opacity: item1.originItemStyle.opacity,
                    },
                    // invisible: true,
                    // draggable: false,

                    z: 99,
                  })
                })
              }
            }
          })
        }

        myChart?.setOption({
          graphic: [...graphic],
        })
      }, 1000)
    },
    [onPointDragging]
  ) // Add dependencies here if any

  useEffect(() => {
    drawGraphic(cleanOptions)
  }, [drawGraphic, cleanOptions])

  console.log("ReactEcharts")

  return (
    <>
      <button
        onClick={() => {
          const myChart = echartsInstanceRef.current
          const op = myChart?.getOption()

          // 取出series中每项数据中的data
          const data =
            op?.series && op.series.length > 0
              ? JSON.stringify(op.series[0].data)
              : ""

          console.log("op", op)

          // Streamlit.setComponentValue(data)
        }}
      >
        更新图表
      </button>
      <ReactEcharts
        ref={echartsElementRef}
        option={cleanOptions}
        // option={options}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: height, width: width }}
        theme={cleanTheme}
        onChartReady={() => {
          Streamlit.setFrameHeight()
        }}
        onEvents={cleanOnEvents}
        opts={{ renderer: renderer }}
      />
    </>
  )
}

export default withStreamlitConnection(EchartsChart)
