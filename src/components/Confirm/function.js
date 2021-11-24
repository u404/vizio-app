import Vue from "vue"

import component from "./main"

const Constructor = Vue.extend(component)

let instance

const func = (options = {}) => {
  const parent = options.parent || document.body

  if (!instance) {
    instance = new Constructor({
      el: document.createElement("div"),
      data: {
        parent
      }
    })
    parent.appendChild(instance.$el)
  } else {
    if (parent !== instance.parent) {
      parent.appendChild(instance.$el)
    }
  }

  Vue.nextTick(() => {
    instance.show(options)
  })

  return instance
}

func.close = () => {
  instance && instance.close()
}

export default func
