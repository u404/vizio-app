import _ from "lodash"
import { queryString } from "@sc/lib-web-utils-intl"

import reporter from "@sc/lib-amplitude"

import InfiniteLoading from "@/components/InfiniteLoading/index"
import Player from "@/components/Player/index"
import AdPlayer from "@/components/AdPlayer/index"

import services from "../services"

const queryData = queryString.parse(location.search)

const PlayerHelper = {

  loading: InfiniteLoading,
  player: Player,
  adPlayer: AdPlayer,

  // 数据
  skuId: "",
  filmInfo: {},
  baseReportData: null,

  reportDelayQueue: [], // 埋点上报延迟队列

  // 事件
  onBack: null,

  onPlay: null,

  onPause: null,

  onEndStateChange: null,

  onAdPlay: null,

  onAdEnd: null,

  // 方法
  logProgress (reportType, video) {
    services.updatePlayProgress({
      ticketNo: this.filmInfo.ticketNo,
      playProgress: Math.ceil(video.currentTime),
      reportType
    })
  },

  setBaseData (skuId = "", filmInfo = {}) {
    this.skuId = skuId
    this.filmInfo = filmInfo
    this.baseReportData = skuId ? { sku_id: skuId, film_name: filmInfo.filmName, ticket_no: filmInfo.ticketNo } : null
    this.reportDelayQueue.forEach(h => h())
    this.reportDelayQueue = []
  },

  clearBaseData () {
    this.setBaseData()
    this.baseReportData = null
    this.reportDelayQueue = []
  },

  report (name, data) {
    const reportHandler = () => reporter.track(name, { ...this.baseReportData, ...data })
    if (this.baseReportData) {
      reportHandler()
    } else {
      this.reportDelayQueue.push(reportHandler)
    }
  },

  reportLoading (loadType, enabled = true, exit = false) {
    loadType = loadType || this._lastReportType
    if (!loadType) return
    const now = Math.round(window.performance.now())
    const loadedTime = now - this._loadingStartTime || 0
    if (enabled) {
      console.log("上报埋点：", loadType, "开始加载")
      this.report("vizio_loading_page_enter", { load_type: loadType })
    } else {
      console.log("上报埋点：", loadType, "加载结束", loadedTime)
      this.report("vizio_loading_page_leave", { load_type: loadType, ms: loadedTime, leave_type: exit ? `主动离开:${exit === -1 ? "退出应用" : "返回上一页"}` : "加载完成进入下一页" })
    }
    this._loadingStartTime = now
    this._lastReportType = enabled ? loadType : ""

    return {
      loadType,
      loadedTime
    }
  },

  initMoviePlayer () {
    console.log("initMoviePlayer")
    this._events = {
      canplay: () => {
        if (!InfiniteLoading.showing()) return
        InfiniteLoading.hide()
        this.reportLoading("影片", false)
        this.report("vizio_film_play_success")
      },
      ended: (e) => {
        if (queryData.TEST_TICKET_USE) { // 核销票
          this.logProgress(4, e)
        }
      },
      endstatechange: (e) => {
        this.onEndStateChange && this.onEndStateChange(e)
      },
      play: (e) => {
        this.onPlay && this.onPlay()
      },
      pause: (e) => {
        this.logProgress(1, e)
        this.onPause && this.onPause()
      },
      back: (e) => {
        this.logProgress(5, e)
        this.onBack()
      },
      timeupdate: (() => _.throttle((e) => {
        this.logProgress(0, e)
      }, 30000))(),
      error: (error) => {
        services.reportError({
          type: 1,
          errorCode: error.detail && error.detail.code,
          errorMsg: error.detail && error.detail.data && error.detail.data[2],
          errorInfo: error.detail,
          url: location.href,
          skuId: this.id,
          extras: this.filmInfo
        })
      },
      loadFail: (error) => {
        services.reportError({
          type: 1,
          errorCode: error.code || -1,
          errorMsg: (error.data && error.data[1] && error.data[1].message) || error.message || "加载失败",
          errorInfo: error,
          url: location.href,
          skuId: this.id,
          extras: this.filmInfo
        })
      }
    }

    Object.keys(this._events).forEach(key => {
      Player.$on(key, this._events[key])
    })
  },

  startMovie () {
    InfiniteLoading.show()
    this.reportLoading("影片")
    Player.start({
      src: this.filmInfo.videoUrl,
      assetId: this.filmInfo.kid,
      progress: this.filmInfo.playProgress
    })
  },

  initAdPlayer () {
    this._adEvents = {
      loadStart: () => {
        this.report("vizio_ads_file_request") // 该埋点调整后，不会上报影片相关信息
      },
      loadSuccess: () => {
        this.report("vizio_ads_file_response", { status: "成功" }) // 该埋点调整后，不会上报影片相关信息
      },
      started: (ad) => {
        InfiniteLoading.hide()
        this.reportLoading("广告", false)
        this._playingAd = { ads_duration: ad.getDuration(), ads_title: ad.getTitle(), ads_des: ad.getDescription() }
        this.report("vizio_ads_video_play", this._playingAd)
        this.onAdPlay && this.onAdPlay()
      },
      timeUpdate: ({ remainingTime, duration }) => {
        if (this._playingAd) {
          this._playingAd.ads_time = duration - remainingTime
        }
      },
      completed: () => {
        this.report("vizio_ads_video_play_stop", { ...this._playingAd, stop_type: "正常结束" })
        this._playingAd = null
        this.onAdEnd && this.onAdEnd()
        this.startMovie()
      },
      error: (err) => {
        if (err.type === "adLoadError") {
          this.report("vizio_ads_file_response", { status: "失败", errorcode: err.errorCode, errormsg: err.errorMessage })
          this.reportLoading("广告", false)
          this.startMovie()
        } else if (err.type === "adPlayError") { // 由于预加载机制的调整，只有adPlayError时，才需要手动切到影片
          this.report("vizio_ads_video_load_failed", { ...this._playingAd, errorcode: err.errorCode, errormsg: err.errorMessage })
          this.reportLoading("广告", false)
          this.startMovie()
        }
        this._playingAd = null
      }
    }

    Object.keys(this._adEvents).forEach(key => {
      AdPlayer.$on(key, this._adEvents[key])
    })
  },

  init () {
    this.initMoviePlayer()
    this.initAdPlayer()
  },

  start () {
    if (!this.filmInfo.ticketSource) {
      try {
        AdPlayer.loadAndStart()
        InfiniteLoading.show()
        this.reportLoading("广告")
      } catch (e) {
        console.log("play Ad Error", e)
        this.startMovie()
      }
    } else {
      this.startMovie()
    }
  },

  stop () {
    Player.stop()
    AdPlayer.stop()
  }

}

PlayerHelper.init()

export default PlayerHelper
