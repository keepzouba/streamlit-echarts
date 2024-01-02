/**
 * https://stackoverflow.com/questions/25333918/js-deep-map-function
 */
import { isFunction, isObject, transform } from "lodash"

/**
 * Run function through every nested value of an object
 * @param obj object
 * @param iterator in our case, very certainly evaluate string to function
 * @param context initial value
 * @returns object with all value passed through function
 */
function deepMap(obj: any, iterator: Function, context: any) {
  return transform(obj, function (result: any, val, key) {
    result[key] = isObject(val)
      ? deepMap(val, iterator, context)
      : iterator.call(context, val, key, obj)
  })
}

export const deepMapFunc = (obj: any, iterator: Function, context: any) => {
  return transform(obj, function (result: any, val, key) {
    // console.log("deepMapFunc", val, key, isFunction(val))

    if (isFunction(val)) {
      console.log("isFunction deepMapFunc", val, key)

      result[key] = iterator.call(context, val, key, obj)
    } else if (isObject(val)) {
      result[key] = deepMapFunc(val, iterator, context)
    } else {
      result[key] = val
    }

    // result[key] = isObject(val)
    //   ? deepMapFunc(val, iterator, context)
    //   : isFunction(val)
    //   ? iterator.call(context, val, key, obj)
    //   : val
  })
}

export default deepMap
