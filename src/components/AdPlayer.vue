<template>
  <div class="ad-player">
    <video class="ad-player-video" ref="video" autoplay></video>
    <div class="ad-container" ref="adContainer"></div>
    <div class="player-controls">
      <div class="ad-progress" v-show="remainingTime">AD: {{remainingTime}}s</div>
      <div class="player-big-button"></div>
    </div>
  </div>
</template>

<script>
import { getUUID, queryString } from "@sc/lib-web-utils-intl"
import posEngine, { keyCodeMap } from "@/common/posEngine"
import { getAdvertiserID, getIP } from "@/common/vizioHelper"

const queryData = queryString.parse(location.search)
const google = window.google

export default {
  props: {
    adEnabled: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      adPlaying: false,
      started: false,
      duration: 0,
      remainingTime: 0
    }
  },

  methods: {

    setupPosEngine () {
      this.$nextTick(() => {
        this._onKeyDownHandler = ({ keyCode }, next) => {
          if (keyCode === keyCodeMap.ok) {
            this.$el.querySelector(".shaka-play-button-container").click() // 直接操作按钮来控制播放暂停
          } else if (keyCode === keyCodeMap.right) {

          } else if (keyCode === keyCodeMap.left) {

          } else {
            next()
          }
        }

        posEngine.onKeyDown(this._onKeyDownHandler)
      })
    },

    destoryPosEngine () {
      posEngine.removeHook("onKeyDown", this._onKeyDownHandler)
    },

    onAdEvent (adEvent) {
      console.log("adEvent", adEvent)
      var ad = adEvent.getAd()
      switch (adEvent.type) {
        case google.ima.AdEvent.Type.LOADED: {
          // if (!ad.isLinear()) {
          //   // video.play()
          // }
          this.duration = ad.getDuration()
          this.$emit("loaded", { duration: this.duration })
          break
        }
        case google.ima.AdEvent.Type.STARTED:
          this.intervalTimer = setInterval(
            () => {
              // this.remainingTime = this.adsManager.getRemainingTime()
              this.remainingTime = Math.floor(this.adsManager.getRemainingTime())
              this.$emit("timeUpdate", { remainingTime: this.remainingTime, duration: this.duration })
            },
            300)
          break
        case google.ima.AdEvent.Type.COMPLETE:
          // if (ad.isLinear()) {
          //   // clearInterval(intervalTimer)
          // }
          clearInterval(this.intervalTimer)
          break
        case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
          this.$emit("completed")
          break
      }
    },

    onAdError (e) {
      const { adsManager } = this
      adsManager && adsManager.destroy()
      this.$emit("error", e)
    },

    onAdsManagerLoaded (adsManagerLoadedEvent) {
      const { video, onAdError, onAdEvent } = this

      var adsRenderingSettings = new google.ima.AdsRenderingSettings()
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true
      adsRenderingSettings.bitrate = 1024
      adsRenderingSettings.mimeTypes = ["video/mp4"]
      // videoContent should be set to the content video element.
      const adsManager = this.adsManager = adsManagerLoadedEvent.getAdsManager(
        video, adsRenderingSettings)

      // Add listeners to the required events.
      adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR,
        (err) => {
          console.log("adsManagerError", err)
          const error = err.getError()
          console.log("adsManagerError222", error)
          onAdError({ ...error.g, ad: error.getAd() })
        })
      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        (adEvent) => {
          this.$emit("started", adEvent.getAd())
        })
      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        (adEvent) => {
          console.log("CONTENT_RESUME_REQUESTED")
          this.$emit("ended", adEvent.getAd())
        })
      adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
        onAdEvent)

      // Listen to any additional events, if necessary.
      adsManager.addEventListener(
        google.ima.AdEvent.Type.LOADED,
        onAdEvent)
      adsManager.addEventListener(
        google.ima.AdEvent.Type.STARTED,
        onAdEvent)
      adsManager.addEventListener(
        google.ima.AdEvent.Type.COMPLETE,
        onAdEvent)

      this.$emit("loadSuccess")
    },

    setup () {
      const video = this.video = this.$refs.video
      const adContainer = this.adContainer = this.$refs.adContainer
      const adDisplayContainer = this.adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, video)
      const adsLoader = this.adsLoader = new google.ima.AdsLoader(adDisplayContainer)
      const { onAdsManagerLoaded, onAdError } = this

      adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (adsManagerLoadedEvent) => {
          onAdsManagerLoaded(adsManagerLoadedEvent)
        },
        false)
      adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        (err) => {
          console.log("adsLoaderError", err)
          onAdError(err.getError().g)
        },
        false)

      const adsRequest = this.adsRequest = new google.ima.AdsRequest()

      adsRequest.setAdWillAutoPlay(true)
      // adsRequest.setContinuousPlayback(true)
      adsRequest.vastLoadTimeout = 10000 // vast 加载超时事件，默认5000ms

      if (queryData.TEST_AD) {
        adsRequest.adTagUrl = "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator="
        adsLoader.requestAds(adsRequest)
      } else {
        getAdvertiserID().then(({ IFA, IFA_TYPE, LMT }) => {
          adsRequest.adTagUrl = `https://vid.springserve.com/rt/1385?w=1920&h=1080&cb=${getUUID(16)}&ip=${getIP()}&ua=${encodeURIComponent(window.navigator.userAgent)}&did=${IFA}&ifa_type=${IFA_TYPE}&dnt=${LMT}&app_bundle=vizio.smartcinema&app_name=SmartCinema&genre=entertainment&appId=hoaoit9b`
          adsLoader.requestAds(adsRequest)
          this.$emit("loadStart")
        })
      }
    },

    start () {
      if (this.started) return
      this.started = true

      const start = () => {
        this.adDisplayContainer.initialize()
        try {
          this.adsManager.init(this.video.clientWidth, this.video.clientHeight, google.ima.ViewMode.NORMAL)
          this.adsManager.start()
        } catch (adError) {
          console.log("adStartError", adError)
          this.onAdError(adError)
        }
      }
      if (this.adsManager) {
        start()
      } else {
        this.$on("loadSuccess", start)
      }
    },

    play () {

    },

    pause () {

    }

  },

  mounted () {
    // this.setupPosEngine()
    this.setup()
  },

  beforeDestroy () {
    // this.destoryPosEngine()
    this.$emit("exit", this.video)
    this.intervalTimer && clearInterval(this.intervalTimer)
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
