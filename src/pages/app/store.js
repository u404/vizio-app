import Vue from "vue"
import Vuex from "vuex"
import env from "@sc/lib-env"
import { queryString } from "@sc/lib-web-utils-intl"
import { inVizio } from "@/common/vizioHelper"
import { AutoRun } from "@/common/lib"

import services from "./services"

const queryData = queryString.parse(location.search)

console.log("queryData-----", queryData)

Vue.use(Vuex)

let autoRunUpdateFilmInfo = null

export default new Vuex.Store({
  state: {
    queryData: queryData,
    baseData: {},
    tempFilmSku: null,
    tempFilmInfo: null, // new
    error: env.env !== "prod" || inVizio || queryData.TEST_BROWSER ? null : "001",
    bindStatus: {},
    isTTSEnabled: false
  },
  getters: {},
  mutations: {
    setState (state, data) {
      Object.keys(data).forEach(key => {
        if (key in state) {
          state[key] = data[key]
        }
      })
    }
  },
  actions: {
    getBaseData ({ state, commit }) {
      return Promise.resolve()
    },

    getBindStatus ({ state, commit }) {
      return services.getBindStatus().then(res => {
        commit("setState", {
          bindStatus: res
        })
        return res
      }).catch(() => {})
    },

    loadFilmInfo ({ state, commit }) {
      if (!state.tempFilmSku) {
        commit("setState", { tempFilmInfo: null })
        return Promise.resolve()
      }
      const skuId = state.tempFilmSku
      return services.getFilmInfo(skuId).then(res => {
        commit("setState", { tempFilmInfo: { ...res, skuId } })
        return res
      })
    },

    autoUpdateFilmInfo ({ state, dispatch }, enabled = true) {
      if (autoRunUpdateFilmInfo) {
        autoRunUpdateFilmInfo.cancel()
        autoRunUpdateFilmInfo = null
      }

      if (enabled) {
        const fn = () => dispatch("loadFilmInfo").catch(() => {}).then(() => {
          if (state.tempFilmInfo && state.tempFilmInfo.hasTicket) {
            throw new Error()
          }
        })
        autoRunUpdateFilmInfo = new AutoRun(fn, 1000)
      }
    }
  }
})
