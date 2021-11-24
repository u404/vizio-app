<template>
  <div class="play" tabindex="0" aria-label="playing">
    <Player :src="playInfo.videoUrl" :assetId="playInfo.kid" :progress="playInfo.playProgress" :adPosition="adPosition" :adEnabled="adEnabled" ref="player" key="player"
    @canplay="onCanplay"
    @ended="onEnded"
    @pause="onPause"
    @exit="onExit"
    @timeupdate="onTimeUpdate"
    @loadStart="onLoadStart"
    @loadEnd="onLoadEnd"
    @adLoadStart="onAdLoadStart"
    @adLoadSuccess="onAdLoadSuccess"
    @adStarted="onAdStarted"
    @adTimeUpdate="onAdTimeUpdate"
    @adCompleted="onAdCompleted"
    @adError="onAdError"
    @error="onError"
    @loadFail="onLoadFail"
    >
      <div class="ended-mask-content" slot="endedMaskContent" ref="endedMaskContent" tabindex="0" :aria-hidden="String(ended)" :aria-label="`Dialog. You have finished watching the movie. Back Button`">
        <div class="content">You have finished watching the movie</div>
        <div class="btns">
          <div class="btn back-btn" :data-pos-x="0" :data-pos-y="0" @click="onBack" tabindex="0" role="button">Back</div>
          <div class="btn replay-btn" :data-pos-x="1" :data-pos-y="0" @click="replay" tabindex="0" role="button">Replay</div>
        </div>
      </div>
    </Player>
    <div class="loading-mask" v-show="loading">
      <i class="logo"></i>
      <div class="tips">Smart Cinema is loading, please wait</div>
    </div>
  </div>
</template>

<script>
import env from "@sc/lib-env"
import Vue from "vue"
import { mapState } from "vuex"
import _ from "lodash"
import Player from "@/components/Player"
import posEngine from "@/common/posEngine"
import posEngineMixin from "@/common/posEngineMixin"

import store from "../store"

import services from "../services"

export default {
  mixins: [posEngineMixin],
  components: {
    Player
  },
  props: {
    id: String
  },
  data () {
    return {
      loading: true,
      film: {

      },
      adCompleted: false,
      adPosition: env.env === "prod" ? 0 : 0,

      ended: false
    }
  },
  computed: {
    ...mapState(["queryData", "tempFilmDetail", "tempPlayInfo"]),

    filmDetail () {
      return this.tempFilmDetail || {}
    },
    playInfo () {
      return this.tempPlayInfo || {}
    },
    src () {
      return decodeURIComponent(this.source)
    },
    adEnabled () {
      return !this.playInfo.ticketSource // 只对免费影片开启广告
    },
    adPlaying () {
      return this.adEnabled && !this.adCompleted
    }
  },
  methods: {

    reporterTrack (name, data) {
      this.$reporter.track(name, { sku_id: this.id, film_name: this.filmDetail.filmName, ticket_no: this.playInfo.ticketNo, ...data })
    },

    onCanplay () {
      this.ended = false
      if (this._played) return
      this._played = true
      this.reporterTrack("vizio_film_play_success")
    },

    onEnded (e) {
      if (this.queryData.TEST_TICKET_USE) { // 核销票
        this.logProgress(4, e)
      }
      this.ended = true
      this.$nextTick(() => {
        this.$refs.endedMaskContent.focus()
      })
    },

    onPause (e) {
      this.logProgress(1, e)
    },

    onExit (e) {
      this.logProgress(5, e)
    },

    onTimeUpdate: (() => _.throttle(function (e) {
      this.logProgress(0, e)
    }, 30000))(),

    logProgress (reportType, video) {
      services.updatePlayProgress({
        ticketNo: this.playInfo.ticketNo,
        playProgress: Math.ceil(video.currentTime),
        reportType
      })
    },

    logByTimeUpdate () {

    },

    replay () {
      this.$refs.player.replay()
      posEngine.moveTo({ x: 0, y: 0 })
    },

    reportLoading (loadType, enabled = true, exit = false) {
      loadType = loadType || this._lastReportType
      if (!loadType) return
      const now = Math.round(window.performance.now())
      const loadedTime = now - this._loadingStartTime || 0
      if (enabled) {
        console.log("上报埋点：", loadType, "开始加载")
        this.reporterTrack("vizio_loading_page_enter", { load_type: loadType })
      } else {
        console.log("上报埋点：", loadType, "加载结束", loadedTime)
        this.reporterTrack("vizio_loading_page_leave", { load_type: loadType, ms: loadedTime, leave_type: exit ? `主动离开:${exit === -1 ? "退出应用" : "返回上一页"}` : "加载完成进入下一页" })
      }
      this._loadingStartTime = now
      this._lastReportType = enabled ? loadType : ""

      return {
        loadType,
        loadedTime
      }
    },

    onLoadStart () {
      this.loading = true
      this.reportLoading("影片")
    },

    onLoadEnd () {
      if (this.loading) {
        this.reportLoading("影片", false)
      }
      this.loading = false
    },

    onAdLoadStart () {
      this.reporterTrack("vizio_ads_file_request")
    },

    onAdLoadSuccess () {
      this.reporterTrack("vizio_ads_file_response", { status: "成功" })
    },

    onAdLoaded () {

    },

    onAdStarted (ad) {
      this.loading = false
      this.reportLoading("广告", false)
      this._playingAd = { ads_duration: ad.getDuration(), ads_title: ad.getTitle(), ads_des: ad.getDescription() }
      console.log("adStart info", this._playingAd)
      this.reporterTrack("vizio_ads_video_play", this._playingAd)
    },

    onAdTimeUpdate ({ remainingTime, duration }) {
      if (this._playingAd) {
        this._playingAd.ads_time = duration - remainingTime
      }
    },

    onAdCompleted () {
      this.reporterTrack("vizio_ads_video_play_stop", { ...this._playingAd, stop_type: "正常结束" })
      this._playingAd = null
    },

    onAdError (err) {
      this.reportLoading("广告", false)
      if (err.type === "adLoadError") {
        this.reporterTrack("vizio_ads_file_response", { status: "失败", errorcode: err.errorCode, errormsg: err.errorMessage })
      } else if (err.type === "adPlayError") {
        const { ad } = err
        this.reporterTrack("vizio_ads_video_load_failed", { ads_duration: ad.getDuration(), ads_title: ad.getTitle(), ads_des: ad.getDescription(), errorcode: err.errorCode, errormsg: err.errorMessage })
      }
      this._playingAd = null
    },

    onBeforeBack () {
      const loadedData = this.reportLoading(null, false, true)
      if (this.loading) {
        const errorInfo = {
          code: 402,
          msg: "加载时按遥控器返回",
          ...loadedData
        }
        services.reportError({
          type: 4,
          errorCode: errorInfo.code,
          errorMsg: errorInfo.msg,
          errorInfo,
          url: location.href,
          skuId: this.id,
          extras: this.film
        })
      }
      if (this._playingAd) {
        this.reporterTrack("vizio_ads_video_play_stop", { ...this._playingAd, stop_type: "用户退出" })
        this._playingAd = null
      }
    },

    onBeforeExit () {
      const loadedData = this.reportLoading(null, false, -1)
      if (this.loading) {
        const errorInfo = {
          code: 401,
          msg: "加载时按遥控器退出键",
          ...loadedData
        }
        services.reportError({
          type: 4,
          errorCode: errorInfo.code,
          errorMsg: errorInfo.msg,
          errorInfo,
          url: location.href,
          skuId: this.id,
          extras: this.film
        })
      }
      if (this._playingAd) {
        this.reporterTrack("vizio_ads_video_play_stop", { ...this._playingAd, stop_type: "用户退出" })
        this._playingAd = null
      }
    },

    onError (error) {
      services.reportError({
        type: 1,
        errorCode: error.detail && error.detail.code,
        errorMsg: error.detail && error.detail.data && error.detail.data[2],
        errorInfo: error,
        url: location.href,
        skuId: this.id,
        extras: this.film
      })
    },

    onLoadFail (error) {
      services.reportError({
        type: 1,
        errorCode: error.code || -1,
        errorMsg: (error.data && error.data[1] && error.data[1].message) || error.message || "加载失败",
        errorInfo: error,
        url: location.href,
        skuId: this.id,
        extras: this.film
      })
    }

  },

  beforeRouteEnter (to, from, next) {
    const { $loading, $alert } = Vue.prototype

    if (store.state.tempFilmSku === to.params.id) {
      next()
      return
    }

    $loading()

    store.commit("setState", { tempFilmSku: to.params.id })

    store.dispatch("loadPlayInfo").then(() => {
      $loading.close()
      if (store.state.tempPlayInfo.hasTicket) {
        next()
      } else {
        $loading.close()
        $alert("No Tickets Available.")
        next(false)
        // const reportTrack = (event) => {
        //   Vue.prototype.$reporter.track(event, { sku_id: to.params.id, film_name: decodeURIComponent(to.query.name) })
        // }

        // Vue.prototype.$confirm({
        //   title: "No Tickets Available.",
        //   content: "Go to your PC to purchase movies",
        //   onSure: (close) => {
        //     close()
        //     reportTrack("vizio_film_to_purchase_pop_confirm")
        //     next({ name: "buy", query: { id: to.params.id, name: to.query.name } })
        //   },
        //   onCancel: (close) => {
        //     close()
        //     reportTrack("vizio_film_to_purchase_pop_cancel")
        //   }
        // })
        // reportTrack("vizio_film_to_purchase_pop")
      }
    }).catch(() => {
      $loading.close()
      $alert("Loading failed. Click Play again and retry.")
      next(false)
    })
  },

  beforeMount () {

  },

  mounted () {
    this.$el.focus()
    this.reporterTrack("vizio_film_play_enter")
    this.reportLoading("广告")
  }
}
</script>

<style lang="scss" scoped>

@keyframes blink {
  from {
    transform: translate(0)  rotate(25deg);
  }
  to {
    transform: translate(rem(1800)) rotate(25deg);
  }
}

.play {
  padding: 0 !important;
  height: 100vh;
  background: #000;

  .ended-mask-content {
    width: 100%;
    height: 100%;
    @include flex(column, center);
    .content {
      @include font(48, 72);
      font-weight: bold;
      color: $color-dark;
    }
    .btns {
      margin-top: rem(109);
      @include flex($jus: center);
      .btn {
        @include button;
        width: rem(300);
        height: rem(88);
        @include font(36, 54);
        font-weight: 500;
      }
    }

  }

  .loading-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $bg-body;
    @include flex(column, center, center);
    z-index: 999;
    .logo {
      display: block;
      width: rem(646);
      height: rem(267);
      background: url(https://g.smartcinemausa.com/images/f026f68850944ee2ba9ec1054fb313cf-1292-534.png) center no-repeat;
      background-size: contain;
    }
    .tips {
      margin-top: rem(106);
      @include font(48, 72);
      font-weight: bold;
      color: $color-dark;
      position: relative;
      overflow: hidden;
      &:before {
        content: "";
        position: absolute;
        left: rem(-1900);
        top: rem(-1400);
        width: rem(3000);
        height: rem(3000);
        border: rem(1250) solid rgba(18, 18, 18, 0.5);
        animation: blink 1.5s linear 0s infinite;
      }
    }
  }
}
</style>
