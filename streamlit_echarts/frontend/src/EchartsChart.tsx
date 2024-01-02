import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"
import { isObject, isFunction } from "lodash"

import * as echarts from "echarts"
import "echarts-gl"
import "echarts-liquidfill"
import "echarts-wordcloud"
import ReactEcharts, { EChartsOption } from "echarts-for-react"

import deepMap, { deepMapFunc } from "./utils"

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

    // console.log("match", match, s)

    if (match) {
      const funcStr = match[1]

      console.log("funcStr", funcStr)

      return new Function("return " + funcStr)()
    } else {
      return s
    }
  }

  // 将options中的function转换成字符串
  const evalFunctionToString = (obj: object, key: any, val: any) => {
    console.log("evalFunctionToString obj", obj, key, val)

    // 如果obj是函数,则返回obj.toString()

    if (isFunction(obj)) {
      return `${JS_PLACEHOLDER}${obj.toString()}${JS_PLACEHOLDER}`
    } else {
      return obj
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

  const evalFunctionToStringDeepMap = (obj: object) => {
    return deepMapFunc(obj, evalFunctionToString, {})
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

  // console.log("options", options)

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

  console.log("cleanOptions", cleanOptions === options)

  const cache = useRef<any>(cleanOptions)

  const cleanOnEvents: any = {}
  const eventKeys = Object.keys(onEvents)

  eventKeys.map((key: string) => {
    const eventFunction = onEvents[key]
    /* eslint-disable-next-line */
    cleanOnEvents[key] = useCallback(
      (params: any) => {
        const s = evalStringToFunction(eventFunction)(params)
        Streamlit.setComponentValue(s)
      },
      [eventFunction]
    )
  })

  // 监听图表的dataZoom事件
  const onZoom = useCallback(
    (params: any) => {
      // 更新缓存

      const op = cache.current

      if (Array.isArray(op.dataZoom)) {
        op.dataZoom[0].start = params.start
        op.dataZoom[0].end = params.end
      } else if (typeof op.dataZoom === "object") {
        op.dataZoom.start = params.start
        op.dataZoom.end = params.end
      }

      // console.log("onZoom", params, op)

      const s = evalFunctionToStringDeepMap(op)

      Streamlit.setComponentValue(s)
    },
    [cleanOptions]
  )

  if (cleanOptions.listeningDataZoom) {
    cleanOnEvents["dataZoom"] = onZoom
  }

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
    (options: any) => {
      console.log("drawGraphic", options)

      // 根据cleanOptions中的series的数组长度，判断有几条折线,根据每条折线的数据长度，判断有几个点,给每个点添加拖拽事件

      const series = options.series

      const myChart = echartsInstanceRef.current

      // 必须是type为line的series

      const graphic: any[] = []

      setTimeout(() => {
        if (Array.isArray(series)) {
          series.forEach((item1, index1) => {
            if (item1.draggable) {
              const data = item1.data

              if (Array.isArray(data)) {
                data.forEach((item2: any, index2: any) => {
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

                    ondragend: function (dx: any, dy: any) {
                      // 清除所有的点

                      myChart?.setOption({
                        graphic: [],
                      })

                      // 对比前后的数据，如果有变化，就更新
                      const prePos = position

                      const curPos = [this.x, this.y]

                      // console.log("prePos", prePos, "curPos", curPos)

                      // 只需要对比y轴数据的变化
                      if (prePos && prePos[1] === curPos[1]) return

                      const op = cache.current

                      const s = evalFunctionToStringDeepMap(op)

                      Streamlit.setComponentValue(s)
                    },

                    onmousemove: function () {
                      showTooltip(index1, index2)
                    },

                    onmouseout: function () {
                      hideTooltip()
                    },

                    z: 100,
                  })
                })
              }

              // 绘制一个初始位置的点
              const sourceData = item1.sourceData

              if (sourceData && Array.isArray(sourceData)) {
                sourceData.forEach((item3: any, index3: any) => {
                  const position = myChart?.convertToPixel(
                    {
                      seriesIndex: index1,
                    },
                    item3
                  )
                  if (item1.origin_symbolSize) {
                    graphic.push({
                      type: "circle",
                      position: position,
                      id:
                        "circle-seriesIndex" +
                        index1 +
                        "-dataIndex" +
                        index3 +
                        "origin",
                      shape: {
                        cx: 0,
                        cy: 0,
                        r: item1.origin_symbolSize,
                      },
                      style: {
                        fill: item1.originItemStyle.color,
                        opacity: item1.originItemStyle.opacity,
                      },

                      z: 99,
                    })
                  }
                })
              }
            }
          })
        }

        // console.log("graphic", graphic)

        myChart?.setOption({
          graphic: [...graphic],
          // tooltip: {
          //   triggerOn: "none",
          //   formatter: function (params: any) {
          //     console.log("params", params)

          //     return (
          //       params.seriesName +
          //       "<br>" +
          //       params.name +
          //       ": " +
          //       params.data[1].toFixed(2)
          //     )
          //   },
          // },
        })
      }, 1000)
    },
    [onPointDragging]
  ) // Add dependencies here if any

  function showTooltip(seriesIndex: number, dataIndex: any) {
    const myChart = echartsInstanceRef.current
    myChart?.dispatchAction({
      type: "showTip",
      seriesIndex: seriesIndex,
      dataIndex: dataIndex,
    })
  }
  function hideTooltip() {
    const myChart = echartsInstanceRef.current
    myChart?.dispatchAction({
      type: "hideTip",
    })
  }

  // const removeGraphic = useCallback((options: any) => {
  //   const myChart = echartsInstanceRef.current

  //   const graphic: any[] = []

  //   const _graphic = myChart?.getOption().graphic

  //   if (Array.isArray(_graphic)) {
  //     _graphic.forEach((item: any, index: number) => {
  //       const elements = item.elements

  //       console.log("elements", elements)

  //       if (Array.isArray(elements)) {
  //         elements.forEach((item2: any, index2: number) => {
  //           if (item2.id.indexOf("circle") > -1) {
  //             graphic.push({
  //               id: item2.id,
  //               $action: "remove",
  //             })
  //           }
  //         })
  //       }
  //     })
  //   }

  //   console.log("_graphic", _graphic)

  //   myChart?.setOption({
  //     graphic: [...graphic],
  //   })
  // }, [])

  useEffect(() => {
    drawGraphic(cleanOptions)
  }, [drawGraphic, cleanOptions])

  console.log("ReactEcharts")

  return (
    <>
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
