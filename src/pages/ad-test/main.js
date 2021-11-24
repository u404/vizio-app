import "@sc/vue-ui-h5/lib/themes/theme-default/index.css"
import "@/common/style/reset.scss"

import "@sc/lib-web-utils-intl" // 引入一系列扩展方法

import vizioHelper from "@/common/vizioHelper"

import Vue from "vue"

import App from "./App.vue"

vizioHelper.init()

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount("#app")
