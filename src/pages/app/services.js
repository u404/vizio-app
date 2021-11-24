import axios from "@sc/lib-axios"

import reporter from "@sc/lib-amplitude"

import { getDeviceId } from "@/common/vizioHelper"

const trackError = (url, data, deviceId, errMsg) => {
  reporter.track("vizio_api_error", { url, data, deviceId, errMsg })
}

const get = (url, data, options, forceDeviceId) => {
  return getDeviceId(forceDeviceId).then(deviceId => {
    options = { ...options, headers: { ...options && options.headers, "X-Device-Id": deviceId, "platformType": 50 } }
    return axios.get(url, data, options).catch(err => {
      trackError(url, data, deviceId, err && (err.msg || err.message))
      throw err
    })
  })
}

const post = (url, data, options) => {
  return getDeviceId().then(deviceId => {
    options = { ...options, headers: { ...options && options.headers, "X-Device-Id": deviceId, "platformType": 50 } }
    return axios.post(url, data, options).catch(err => {
      trackError(url, data, deviceId, err && (err.msg || err.message))
      throw err
    })
  })
}

export default {

  getFilmInfo (skuId) {
    // return Promise.all([this.getFilmDetail(skuId), this.getPlayInfo(skuId)]).then(([detail, playInfo]) => ({ ...detail, ...playInfo }))
    return get("/index/vizio/getFilmDetailWithPlayInfo", { skuId })
  },

  getFilmDetail (skuId) {
    return get("/index/vizio/getFilmDetail", { skuId })
  },

  getPlayInfo (skuId) {
    return get("/index/vizio/getPlayInfoByDeviceId", { skuId })
  },

  getHomeInfo () {
    return get("/index/vizio/v1/getIndexInfo", undefined, undefined, false)
  },

  getActivityInfo (id) {
    return get("/index/vizio/v1/getIndexInfo", { type: id })
  },

  getTicketList () {
    return get("/index/vizio/getTicketList")
  },

  createPayCode (skuId) {
    return post("/index/vizio/createPayCode", { skuId })
  },

  getPayCodeStatus (code) {
    return get("/index/vizio/getPayCodeStatus", { code })
  },

  updatePlayProgress ({ ticketNo, playProgress, reportType }) {
    return post("/playlog/ticket/playFilmProgressUploadWithOutAuth", { ticketNo, playProgress, reportType })
  },

  testPost (data) {
    return post("/vizio/test", data)
  },

  reportError (error) {
    const extras = {
      pageStayTime: Math.round(window.performance.now() - window.__lastRouteTime),
      appStayTime: Math.round(window.performance.now()),
      ...error.extras
    }

    error.extras = JSON.stringify(extras)
    error.errorInfo = JSON.stringify(error.errorInfo)

    return post("/index/vizio/reportLog", error)
  },

  // 上报播放流水
  reportPlayInfo (data) {
    return post("/statistics/playFlow", { data })
  }
}
