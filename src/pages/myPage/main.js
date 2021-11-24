import "@/common/style/reset.scss"

import Vue from "vue"

import "@sc/lib-web-utils-intl" // 引入一系列扩展方法

import "@sc/vue-ui-h5/lib/themes/theme-default/index.css"
import ui from "@sc/vue-ui-h5"

import plugins from "@/plugins"

import store from "./store"

import App from "./App.vue"

import regionLocale from "@sc/lib-region-locale"
import locales from "./locales.js"

Vue.use(regionLocale, { locales })

Vue.use(ui)

Vue.use(plugins)

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount("#app")

console.log("webviewSize", window.innerWidth, window.innerHeight)
