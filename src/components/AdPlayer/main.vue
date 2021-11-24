<template>
  <div class="ad-player" v-show="visible">
    <div class="ad-container" ref="adContainer"></div>
    <div class="player-controls">
      <div class="ad-progress" v-show="remainingTime">AD: {{remainingTime}}s</div>
    </div>
  </div>
</template>

<script>
import { getUUID, queryString } from "@sc/lib-web-utils-intl"
import { getAdvertiserID, getIP } from "@/common/vizioHelper"

const queryData = queryString.parse(location.search)
const google = window.google

export default {
  props: {
    adEnabled: {
      type: Boolean,
      default: false
    },
    adPosition: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      remainingTime: 0,
      visible: false,
      error: null
    }
  },

  methods: {

    setup () {
      const adContainer = this.adContainer = this.$refs.adContainer
      const adDisplayContainer = this.adDisplayContainer = new google.ima.AdDisplayContainer(adContainer)
      const adsLoader = this.adsLoader = new google.ima.AdsLoader(adDisplayContainer)

      adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (err) => {
        if (this.stopState) return
        console.log("adsLoaderError：", err)
        this.error = err
        this.$emit("error", err.getError().g)
      }, false)

      adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (adsManagerLoadedEvent) => {
        var adsRenderingSettings = new google.ima.AdsRenderingSettings()
        adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true
        adsRenderingSettings.bitrate = 1024
        adsRenderingSettings.mimeTypes = ["video/mp4"]

        const adsManager = this.adsManager = adsManagerLoadedEvent.getAdsManager({ currentTime: 0 }, adsRenderingSettings)

        // Add listeners to the required events.
        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (e) => {
          if (this.stopState) return
          console.log("adsManagerError：", e)
          this.stop()
          this.$emit("error", e.getError().g) // 广告放映出错
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, (e) => {
          this.$emit("started", e.getAd()) // 开始播放广告
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, (e) => {
          this.$emit("ended", e.getAd()) // 播放完成
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, (e) => {
          this.stop()
          this.$emit("completed", e.getAd())
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, (e) => {
          // if (!ad.isLinear()) {
          //   // video.play()
          // }
          console.log("adsManagerLoaded", e)
          var ad = e.getAd()
          this.duration = ad.getDuration()
          this.$emit("loaded", { duration: this.duration }) // 视频加载成功
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, (e) => {
          this.intervalTimer = setInterval(() => {
            this.remainingTime = Math.floor(this.adsManager.getRemainingTime())
            this.$emit("timeUpdate", { remainingTime: this.remainingTime, duration: this.duration }) // 播放进度更新
          }, 300)
        })
        adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, (e) => {
          clearInterval(this.intervalTimer)
        })

        this.$emit("loadSuccess") // vast加载成功

        // initAdsManager-----------------------
        adDisplayContainer.initialize()
        try {
          adsManager.init(window.innerWidth, window.innerHeight, google.ima.ViewMode.NORMAL)

          this.onStart && this.onStart()
        } catch (err) {
          console.log("adsManagerInitError：", err)
          this.error = err
          adsManager && adsManager.destroy()
        }
      }, false)
    },

    preload () {
      this.stopState = false
      this.error = null

      const adsRequest = this.adsRequest = new google.ima.AdsRequest()

      adsRequest.setAdWillAutoPlay(true)
      // adsRequest.setContinuousPlayback(true)
      adsRequest.vastLoadTimeout = 10000 // vast 加载超时事件，默认5000ms

      if (queryData.TEST_AD) {
        adsRequest.adTagUrl = "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator="
        this.adsLoader.requestAds(adsRequest)
      } else {
        getAdvertiserID().then(({ IFA, IFA_TYPE, LMT }) => {
          adsRequest.adTagUrl = `https://vid.springserve.com/rt/1385?w=1920&h=1080&cb=${getUUID(16)}&ip=${getIP()}&ua=${encodeURIComponent(window.navigator.userAgent)}&did=${IFA}&ifa_type=${IFA_TYPE}&dnt=${LMT}&app_bundle=vizio.smartcinema&app_name=SmartCinema&genre=entertainment&appId=hoaoit9b`
          this.adsLoader.requestAds(adsRequest)
        })
      }
      this.$emit("loadStart") // 开始加载广告vast
    },

    start () {
      this.onStart = null
      if (this.error) {
        throw this.error
      }
      if (this.stopState) return
      if (!this.adsManager) {
        throw new Error("adsManager not loaded.")
      }
      try {
        this.adsManager.start()
        this.visible = true
        return true
      } catch (err) {
        console.log("adsManagerStartError：", err)
        this.adsManager && this.adsManager.destroy()
        this.visible = false
        this.$emit("error", { type: "adStartError" })
        throw err
      }
    },

    loadAndStart () {
      this.onStart = () => this.start()
      this.preload()
    },

    stop () {
      this.stopState = true
      if (this.adsManager) {
        this.visible = false
        this.intervalTimer && clearInterval(this.intervalTimer)
        this.remainingTime = 0
        this.adsManager.stop()
        this.adsManager.destroy()
        this.adsManager = null
      }
    },

    on (name, handler) {
      this.$on(name, handler)
    },

    off (name, handler) {
      this.$off(name, handler)
    }

  },

  mounted () {
    this.$nextTick(() => {
      this.setup()
    })
  },

  beforeDestroy () {
    this.stop()
  }
}
</script>

<style lang="scss">
.ad-player {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 100;
  &-video {
    width: 100%;
    height: 100%;
  }
  .ad-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  //全屏按钮

  .player-controls {
    .ad-progress {
      position: absolute;
      top: rem(30);
      right: rem(30);
      color: #fff;
      @include font(30, 30);
      font-weight: bold;
    }
    .player-big-button {

    }
  }

}
</style>
