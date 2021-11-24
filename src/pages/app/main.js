import "@sc/vue-ui-h5/lib/themes/theme-default/index.css"
import "@/common/style/reset.scss"

import "@sc/lib-web-utils-intl" // 引入一系列扩展方法

import regionLocale from "@sc/lib-region-locale"
import locales from "./locales.js"

import vizioHelper from "@/common/vizioHelper"

import Vue from "vue"

import ui from "@sc/vue-ui-h5"

import plugins from "@/plugins"

import store from "./store"

import router from "./router"

import App from "./App.vue"

Vue.use(regionLocale, { locales, defaultLocale: "en_US" })

vizioHelper.init()

Vue.use(ui)

Vue.use(plugins)

Vue.config.productionTip = false

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount("#app")
