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

let autoRunUpdatePlayInfo = null

export default new Vuex.Store({
  state: {
    queryData: queryData,
    baseData: {},
    tempFilmSku: null,
    tempFilmDetail: null,
    tempPlayInfo: null,
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

    loadFilmDetail ({ state, commit }) {
      if (!state.tempFilmSku) {
        commit("setState", { tempFilmDetail: null })
        return Promise.resolve()
      }
      return services.getFilmDetail(state.tempFilmSku).then(res => {
        commit("setState", { tempFilmDetail: res })
        return res
      })
    },

    loadPlayInfo ({ state, commit }) {
      if (!state.tempFilmSku) {
        commit("setState", { tempPlayInfo: null })
        return Promise.resolve()
      }
      return services.getPlayInfo(state.tempFilmSku).then(res => {
        if (state.tempPlayInfo && !state.tempPlayInfo.hasTicket && !res.hasTicket) {
          return
        }
        res.playProgress = state.queryData.TEST_PROGRESS >= 0 ? +state.queryData.TEST_PROGRESS : res.playProgress
        commit("setState", { tempPlayInfo: res })
      })
    },

    autoUpdatePlayInfo ({ state, dispatch }, enabled = true) {
      if (autoRunUpdatePlayInfo) {
        autoRunUpdatePlayInfo.cancel()
        autoRunUpdatePlayInfo = null
      }

      if (enabled) {
        const fn = () => dispatch("loadPlayInfo").catch(() => {}).then(() => {
          if (state.tempPlayInfo && state.tempPlayInfo.hasTicket) {
            throw new Error()
          }
        })
        autoRunUpdatePlayInfo = new AutoRun(fn, 1000)
      }
    }
  }
})
