<template>
  <div class="player shaka-player-container" :class="{ paused, 'ad-playing': adPlaying, ended }" data-shaka-player-container data-shaka-player-cast-receiver-id="7B25EC44">
    <video class="shaka-player-video" ref="video" autoplay data-shaka-player></video>
    <AdPlayer @loadStart="onAdLoadStart" @loadSuccess="onAdLoadSuccess" @loaded="onAdLoaded" @started="onAdStarted" @timeUpdate="onAdTimeUpdate" @error="onAdError" @completed="onAdCompleted" key="adplayer" ref="adPlayer"></AdPlayer>
    <div class="player-controls">
      <!-- <div class="player-big-play-btn" @click="play"></div> -->
      <div class="player-ended-mask">
        <slot name="endedMaskContent"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { getUUID, queryString } from "@sc/lib-web-utils-intl"
import posEngine, { keyCodeMap } from "@/common/posEngine"
import { getAdvertiserID, getIP, onCCStateChange, offCCStateChange } from "@/common/vizioHelper"
import AdPlayer from "@/components/AdPlayer"
import axios from "@sc/lib-axios"

const queryData = queryString.parse(location.search)

export default {
  components: {
    AdPlayer
  },
  props: {
    src: String,
    assetId: String,
    progress: {
      type: Number,
      default: 0
    },

    adEnabled: {
      type: Boolean,
      default: false
    },
    adPosition: {
      type: Number,
      default: 0 // 广告插入的位置，在第几秒开始放映
    }
  },

  data () {
    return {
      loading: true,
      paused: true,
      ended: false,
      adStarted: false,
      adPlaying: false,
      videoReady: false,
      replayed: false
    }
  },

  watch: {
    src: {
      immediate: true,
      handler (v) {
        v && this.onReady(() => this.load())
      }
    },
    adPlaying: {
      handler (v) {
        if (v) {
          this.video.pause()
        } else {
          this.video.play()
        }
      }
    }
  },

  computed: {
    adTime () {
      return queryData.TEST_AD_POSITION >= 0 ? +queryData.TEST_AD_POSITION : this.adPosition
    },
    progressTime () {
      if (this.replayed) return 0
      return queryData.TEST_PROGRESS >= 0 ? +queryData.TEST_PROGRESS : this.progress
    }
  },

  methods: {

    clearControlsTimer () {
      if (this.controlsTimer) {
        clearTimeout(this.controlsTimer)
        this.controlsTimer = null
      }
    },

    showControls () {
      const controls = this.$el.querySelector(".shaka-controls-container")
      this.clearControlsTimer()
      controls.setAttribute("shown", "true")
      this.controlsTimer = setTimeout(() => {
        this.clearControlsTimer()
        controls.removeAttribute("shown")
      }, 2000)
    },

    setupPosEngine () {
      this.$nextTick(() => {
        posEngine.onKeyDown(({ keyCode }, next) => {
          const { video, ended, adPlaying, loading, videoReady } = this
          if (ended && !adPlaying) {
            next()
            return
          }
          if (!videoReady) {
            this.$alert("Please wait for the video buffer to complete.")
          } else if (keyCode === keyCodeMap.ok) {
            if (adPlaying) return
            this.$el.querySelector(".shaka-play-button-container").click() // 直接操作按钮来控制播放暂停
            // if (loading) return
            // if (video.paused) {
            //   video.play()
            // } else {
            //   video.pause()
            // }
          } else if (keyCode === keyCodeMap.right) {
            if (adPlaying) return
            video.currentTime += 10
          } else if (keyCode === keyCodeMap.left) {
            if (adPlaying) return
            video.currentTime -= 10
          } else {
            next()
          }
        })
      })
    },

    setup () {
      const video = this.video = this.$refs.video
      const ui = video["ui"]
      ui.configure({
        addBigPlayButton: true,
        "controlPanelElements": ["time_and_duration"]
      })
      const controls = ui.getControls()
      const player = this.player = controls.getPlayer()

      this.player.configure({
        abr: {
          defaultBandwidthEstimate: 4000000,
          switchInterval: 10000,
          restrictions: {
            minBandwidth: 1000000
          }
        },
        streaming: {
          alwaysStreamText: true
        }
        // streaming: {
        //   retryParameters: {
        //     baseDelay: 2000,
        //     backoffFactor: 2000
        //   }
        //   // rebufferingGoal: 4,
        //   // bufferingGoal: 8
        // }
      })

      this.video.addEventListener("timeupdate", () => {
        this.tryPlayAd(this.video.currentTime)
      })

      // 字幕设置
      // this.player.setTextTrackVisibility(true)
      // this.player.isTextTrackVisible()

      window.player = player

      this.player.setTextTrackVisibility(true)

      this.video.addEventListener("loadedmetadata", () => {
        console.log("loadedmetadata")
        this._ccHandler = ccOn => {
          this.player.setTextTrackVisibility(!!ccOn)
        }
        onCCStateChange(this._ccHandler)
        if (this.progressTime >= Math.floor(this.video.duration)) {
          this.ended = true
          this.$emit("ended", this.video)
        }
      })

      // this.video.addEventListener("loadeddata", () => {
      //   const progress = this.adStartTime || this.progressTime
      //   if (progress) {
      //     this.video.currentTime = progress
      //   }
      // })

      this.video.addEventListener("ended", () => {
        this.ended = true
        this.$emit("ended", this.video)
      })

      this.video.addEventListener("canplay", () => {
        console.log("canplay")
        if (!this.videoReady) {
          this.videoReady = true
          if (!this.replayed) {
            this.$emit("loadEnd")
          }
        }
        this.$emit("canplay")
      })

      this.video.addEventListener("play", () => {
        this.paused = false
        this.clearControlsTimer()
      })
      this.video.addEventListener("pause", () => {
        this.paused = true
        this.$emit("pause", this.video)
        this.clearControlsTimer()
      })

      this.video.addEventListener("timeupdate", () => {
        this.$emit("timeupdate", this.video)
      })

      this.video.addEventListener("seeking", (e) => {
        this.showControls()
        console.log("seeking", e, this.video.currentTime)
        this._seekingTimer && clearTimeout(this._seekingTimer)
        this._seekingTimer = setTimeout(() => {
          if (this.videoReady && this.waiting && this.video.seeking) {
            video.currentTime += 0
          }
        }, 2000)
      })

      this.video.addEventListener("seeked", () => {
        console.log("seeked")
      })

      this.video.addEventListener("canplaythrough", () => {
        this.waiting = false
        this.loading = false
        if (!this.adPlaying) {
          video.play()
        }
        console.log("canplaythrough")
      })

      this.video.addEventListener("waiting", () => {
        this.waiting = true
        this.loading = true
        console.log("waiting")
      })

      // this.video.addEventListener("progress", () => {
      //   console.log("progress", this.video.seeking, this.waiting, this.video.currentTime)
      //   if (this.videoReady && this.waiting && this.video.seeking) {
      //     video.currentTime += 0 // hack 处理 视频进度连续拖拽时卡主的问题
      //   }
      //   // video.currentTime += 0 // hack 处理 视频进度连续拖拽时卡主的问题
      // })

      // this.player.addEventListener("buffering", (buffering) => {
      //   console.log("buffering", buffering.buffering)
      // })

      this.player.addEventListener("error", (error) => {
        this.$emit("error", error)
        console.error("Error code", (error.detail && error.detail.code) || error.code, "object", error)
      })

      this.ready = true
      this.$emit("ready")
      console.log("ready", this.ready)
    },

    onReady (success) {
      if (this.ready) {
        success()
      } else {
        this.$on("ready", success)
      }
    },

    load () {
      if (this.tryPlayAd(this.progressTime)) return

      this.videoReady = false
      this.videoInited = true

      this.player.configure("drm.servers", { "com.widevine.alpha": `${axios.baseURL || ""}/drm/getDrmInfo?platform=shaka&uId=1&logRequestId=cdf0283272f4ef1338bd186aac8a93fa&assetId=${this.assetId}` })

      const progress = this.adStartTime || this.progressTime

      this.$emit("loadStart")
      this.player.load(this.src, progress).then(res => {
        console.log("src loaded")
      }).catch(err => {
        console.log("src load error: ", err)
        this.$emit("loadFail", err)
      })
    },

    play () {
      this.video && this.video.play()
    },

    pause () {
      this.video && this.video.pause()
    },

    replay () {
      this.ended = false
      // if (this.video) {
      //   this.video.currentTime = 0
      //   this.video.play()
      // }
      this.videoReady = false
      this.replayed = true
      this.player.load(this.src, 0).then(res => {
        console.log("src loaded")
      }).catch(err => {
        console.log("src load error: ", err)
        this.$emit("loadFail", err)
      })
    },

    initUI () {
      var event = document.createEvent("Events")
      event.initEvent("load", true, true)
      window.dispatchEvent(event)
      let inited = false
      const setupHanler = () => {
        if (inited) return
        inited = true
        this.setup()
      }
      if (!this.shakaUILoadedListeners) {
        this.shakaUILoadedListeners = []
      }
      this.shakaUILoadedListeners.push(setupHanler)
      document.addEventListener("shaka-ui-loaded", setupHanler)
    },

    tryPlayAd (progress) {
      if (this.adEnabled && !this.adStarted && progress >= this.adTime) {
        this.adStart()
        return true
      }
      return false
    },

    adStart () {
      this.adStarted = true
      this.$refs.adPlayer.start()
    },

    onAdLoadStart () {
      this.$emit("adLoadStart")
    },

    onAdLoadSuccess () {
      this.$emit("adLoadSuccess")
    },

    onAdLoaded () {
      this.$emit("adLoaded")
    },

    onAdTimeUpdate (data) {
      this.$emit("adTimeUpdate", data)
    },

    onAdStarted (e) {
      this.adPlaying = true
      this.adStartTime = this.video.currentTime || this.progressTime || 0
      console.log("adStartTime", this.adStartTime)
      this.$emit("adStarted", e)
    },
    onAdCompleted (e) {
      this.load()
      this.adPlaying = false
      this.$emit("adCompleted", e)
    },
    onAdError (e) {
      this.$emit("adError", e)
      if (this.adPlaying || !this.videoInited) {
        this.load()
      }
      this.adPlaying = false
    }

  },

  mounted () {
    this.setupPosEngine()
    this.initUI()
    // this.setup()
  },

  beforeDestroy () {
    if (this.shakaUILoadedListeners) {
      this.shakaUILoadedListeners.forEach(o => document.removeEventListener("shaka-ui-loaded", o))
    }
    offCCStateChange(this._ccHandler)
    this.clearControlsTimer()
    if (this._seekingTimer) {
      clearTimeout(this._seekingTimer)
      this._seekingTimer = null
    }
    this.player && this.player.destroy()
    this.video && (this.video.src = "")
    this.pause()
    this.$emit("exit", this.video)
  }
}
</script>

<style lang="scss">
.shaka-player {
  &-container {
    width: 100%;
    height: 100%;

    .shaka-text-container {
      z-index: 1;
    }

    .shaka-text-container * {
      padding-bottom: rem(30);
      @include font(60, 80);
      background: none;
      text-shadow: rem(10) rem(4) rem(12) #000;
    }

  }
  &-video {
    width: 100%;
    height: 100%;
  }
  //全屏按钮

}

.player {
  position: relative;

  @mixin mask() {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3) center no-repeat;
    background-size: rem(200);
    z-index: 10;
    display: none;
  }
  &-controls {

  }
  &-big-play-btn {
    @include mask;
    background-image: url(https://g.smartcinemausa.com/images/fa038af1d6b84657a7accd621bc5f9ef-400-400.png);
    background-size: rem(200);
  }

  &-ended-mask {
    @include mask;
  }

  &.ad-playing {
    .shaka-player-video {
      display: none;
    }
    .shaka-controls-container {
      display: none !important;
    }
    .shaka-bottom-controls {
      display: none !important;
    }
    .shaka-spinner-container{
      display: none !important;
    }
  }

  &.ended:not(.ad-playing) {
    .shaka-controls-container {
      display: none !important;
    }

    .video {
      display: none;
    }
    .player-ended-mask {
      display: block;
    }
  }
}

</style>
