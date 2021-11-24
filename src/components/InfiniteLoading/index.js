import Vue from "vue"

import component from "./main"

const Constructor = Vue.extend(component)

const instance = new Constructor({
  el: document.createElement("div"),
  data: {
    parent: document.body
  }
})

document.body.appendChild(instance.$el)

export default instance
