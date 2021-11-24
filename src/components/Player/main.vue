<template>
  <div class="player-wrap" v-show="visible">
    <div class="movie-player shaka-player-container" ref="player" :class="{ 'controls-visible': controlsVisible, 'progress-visible': progressVisible, ended }">
      <video class="shaka-player-video" ref="video" autoplay></video>
      <div class="movie-player-controls">
        <transition name="fade">
          <div class="movie-player-play-button" :icon="buffering ? 'buffering' : (paused ? 'play' : 'pause')" v-show="playButtonVisible && !ended"></div>
        </transition>
        <transition name="fade">
          <div class="movie-player-progress-bar" :style="`background-image: linear-gradient(to right, #EFD591 0%, #FDF2B8 ${currentTime/duration*100}%, rgba(255, 255, 255, 0.26) ${currentTime/duration*100}%)`" v-show="progressVisible && !ended"></div>
        </transition>
        <transition name="fade">
          <div class="movie-player-progress-time" v-show="progressVisible && !ended">{{ `${getTimeDisplay(currentTime)} / ${getTimeDisplay(duration)}` }}</div>
        </transition>
      </div>
    </div>

    <div class="movie-player-ended-mask" ref="endedMask" tabindex="0" :aria-hidden="String(!ended)" :aria-label="`You have finished watching the movie. Back Button`" v-show="ended">
      <div class="content">You have finished watching the movie</div>
      <div class="btns">
        <div class="btn back-btn" :data-pos-x="0" :data-pos-y="0" @click="back" tabindex="0" role="button">Back</div>
        <div class="btn replay-btn" :data-pos-x="1" :data-pos-y="0" @click="replay" tabindex="0" role="button">Replay</div>
      </div>
    </div>

  </div>

</template>

<script>
import shaka from "shaka-player"

import posEngine, { keyCodeMap } from "@/common/posEngine"
import { onCCStateChange, offCCStateChange } from "@/common/vizioHelper"

import axios from "@sc/lib-axios"

export default {
  components: {
  },

  data () {
    return {
      ended: false,
      sourceReady: false,
      visible: false,
      // props
      src: "",
      assetId: "",
      progress: 0,

      // 自定义控件属性
      controlsVisible: false,
      progressVisible: false,
      duration: 0,

      currentTime: 0,
      playButtonVisible: false,
      paused: true,
      buffering: false
    }
  },

  computed: {
    // adTime () {
    //   return queryData.TEST_AD_POSITION >= 0 ? +queryData.TEST_AD_POSITION : this.adPosition
    // },
    // progressTime () {
    //   return queryData.TEST_PROGRESS >= 0 ? +queryData.TEST_PROGRESS : this.progress
    // }
  },

  watch: {
    ended: {
      immediate: true,
      handler (v) {
        this.$emit("endstatechange", v)
      }
    }
  },

  methods: {

    getTimeDisplay (time) {
      time = Math.round(time)
      const seconds = time % 60
      const minutes = Math.floor(time / 60) % 60
      const hours = Math.floor(time / 3600)

      return `${hours ? `${hours}:` : ""}${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`
    },

    showPlayButton (show, autoHide = false) {
      this.playButtonVisible = show
      this.playButtonVisibleTimer_ && clearTimeout(this.playButtonVisibleTimer_)
      if (autoHide) {
        this.playButtonVisibleTimer_ = setTimeout(() => {
          this.playButtonVisible = false
        }, 3000)
      }
    },

    showProgress (show, autoHide = false) {
      this.progressVisible = show
      this.progressVisibleTimer_ && clearTimeout(this.progressVisibleTimer_)
      if (autoHide) {
        this.progressVisibleTimer_ = setTimeout(() => {
          this.progressVisible = false
        }, 3000)
      }
    },

    showBottomControls (show, autoHide = false) {
      this.showPlayButton(show, autoHide)
      this.showProgress(show, autoHide)
    },

    setupPosEngine (enable = true) {
      if (enable && !this._posHandler) {
        console.log("setup", true)
        this._posHandler = ({ keyCode }, next) => {
          const { video, ended, sourceReady } = this
          console.log("keyCode", keyCode)
          if (ended) {
            next()
            return
          }
          if (!sourceReady) {
            this.$alert("Please wait for the video buffer to complete.")
          } else if (keyCode === keyCodeMap.ok) {
            // this.$el.querySelector(".shaka-play-button-container").click() // 直接操作按钮来控制播放暂停
            if (this.paused) {
              this.video.play()
            } else {
              this.video.pause()
            }
          } else if (keyCode === keyCodeMap.right) {
            console.log("focusEl", document.activeElement)
            video.currentTime += 10
          } else if (keyCode === keyCodeMap.left) {
            video.currentTime -= 10
          } else {
            next()
          }
        }
        posEngine.onKeyDown(this._posHandler)
        window.posEngine = posEngine
      } else if (!enable && this._posHandler) {
        console.log("setup", false)
        posEngine.removeHook("onKeyDown", this._posHandler)
        this._posHandler = null
      }
    },

    enableSeekingFixTimer (bool = true) {
      if (!bool) {
        clearInterval(this._seekingTimer)
        return
      }

      const now = window.performance.now()
      if (now - this._lastSeekingTime < 2000) {
        clearInterval(this._seekingTimer)
        this._seekingTimer = window.setInterval(() => {
          this.video.currentTime += 0
        }, 2000)
      }
      this._lastSeekingTime = now
    },

    enableCCStateListener (bool = true) {
      if (!bool) {
        this._ccHandler && offCCStateChange(this._ccHandler)
        return
      }

      if (bool && this._ccHandler) return

      this._ccHandler = ccOn => {
        this.player.setTextTrackVisibility(!!ccOn)
      }
      onCCStateChange(this._ccHandler)
    },

    setupEvents () {
      this.video.addEventListener("loadedmetadata", () => {
        this.player.setTextTrackVisibility(true)
        this.enableCCStateListener(true)
        this.duration = this.video.duration
        console.log("video duration", this.duration)
        if (this.progress >= Math.floor(this.video.duration)) {
          this.setEnded()
        }
      })

      this.video.addEventListener("ended", () => {
        this.setEnded()
      })

      this.video.addEventListener("canplay", () => {
        console.log("canplay")
        if (!this.sourceReady) {
          this.sourceReady = true
          if (!this.controlsVisible) {
            this.controlsVisible = true
          }
        }
        this.$emit("canplay")
      })
      this.video.addEventListener("play", () => {
        this.paused = false
        this.$emit("play", this.video)
        this.showBottomControls(false)
      })
      this.video.addEventListener("pause", () => {
        this.paused = true
        this.$emit("pause", this.video)
        this.showBottomControls(true)
      })

      this.video.addEventListener("timeupdate", () => {
        this.$emit("timeupdate", this.video)
      })

      this.video.addEventListener("timeupdate", () => {
        this.currentTime = this.video.currentTime
      })

      this.video.addEventListener("seeking", (e) => {
        console.log("seeking")
        this.currentTime = this.video.currentTime
        this.showBottomControls(true)
        this.enableSeekingFixTimer(true)
      })

      this.video.addEventListener("seeked", () => {
        console.log("seeked")
        this.showBottomControls(true, true)
        this.enableSeekingFixTimer(false)
      })

      this.video.addEventListener("waiting", () => {
        this.buffering = true
        console.log("buffering")
      })

      this.video.addEventListener("canplaythrough", () => {
        this.buffering = false
        if (this.visible) {
          this.video.play()
        }
        console.log("canplaythrough")
      })

      this.player.addEventListener("error", (error) => {
        this.$emit("error", error)
        console.error("Error code", (error.detail && error.detail.code) || error.code, "object", error)
      })
    },

    setupNetworkEngine () {
      const vm = this
      shaka.net.NetworkingEngine.prototype._request = shaka.net.NetworkingEngine.prototype.request
      shaka.net.NetworkingEngine.prototype.request = function (type, request) {
        if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST) {
          return this._request(type, request)
        }

        const res = vm._manifestCaches.find(o => o.uri === request.uris[0])
        if (res) {
          return res.req
        }
        const req = this._request(type, request)
        if (vm._manifestCaches.length >= 5) {
          vm._manifestCaches.pop()
        }
        vm._manifestCaches.unshift({ uri: request.uris[0], req })
        return req
      }
    },

    setup () {
      const video = this.video = this.$refs.video
      this.player = new shaka.Player(video)

      window.player = this.player

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

      })

      this.setupEvents()

      this._manifestCaches = []

      this.src && this.load()
    },

    load () {
      this.sourceReady = false
      this.buffering = true

      this.player.configure("drm.servers", { "com.widevine.alpha": `${axios.baseURL || ""}/drm/getDrmInfo?platform=shaka&uId=1&logRequestId=cdf0283272f4ef1338bd186aac8a93fa&assetId=${this.assetId}` })

      this.player.load(this.src, this.progress).then(res => {
        console.log("src loaded")
      }).catch(err => {
        console.log("src load error: ", err)
        this.$emit("loadFail", err)
      })
    },

    async preload (src) {
      const res = await new shaka.net.NetworkingEngine().request(shaka.net.NetworkingEngine.RequestType.MANIFEST, {
        uris: [src],
        method: "GET",
        retryParameters: {
          maxAttempts: 2,
          baseDelay: 1000,
          backoffFactor: 1,
          fuzzFactor: 0.5,
          timeout: 8000
        }
      }).promise

      const { data } = res

      if (this._manifestCaches.find(o => o.src === src)) {
        return true
      }

      if (this._manifestCaches.length >= 5) {
        this._manifestCaches.pop()
      }
      this._manifestCaches.unshift({ src, data })

      console.log("preload manifest", data)
    },

    start ({ src = "", assetId = "", progress = 0 }) {
      this.src = src
      this.assetId = assetId
      this.progress = progress
      this.visible = true
      this.load()
      this.setupPosEngine(true)
    },

    stop () {
      this.enableCCStateListener(false)
      this.showBottomControls(false)
      this.enableSeekingFixTimer(false)
      this.video && this.video.pause()
      this.player.unload(true)
      this.ended = false
      this.controlsVisible = false
      this.visible = false
      this.setupPosEngine(false)
    },

    setEnded () {
      this.ended = true
      this.$nextTick(() => {
        posEngine.activeFirstElement(this.$refs.endedMask)
        this.$refs.endedMask.focus()
      })
      this.$emit("ended", this.video)
    },

    replay () {
      this.ended = false
      this.progress = 0
      this.load()
      // if (this.video) {
      //   this.$el.querySelector(".shaka-play-button-container").click()
      // }
      posEngine.moveTo({ x: 0, y: 0 })
      this.$emit("replay")
    },

    back () {
      const videoData = { currentTime: this.video.currentTime, duration: this.video.duration }
      this.stop()
      this.$emit("back", videoData)
    },

    getCurrentTime () {
      return (this.video && this.video.currentTime) || 0
    },

    on (name, handler) {
      this.$on(name, handler)
    },

    off (name, handler) {
      this.$off(name, handler)
    }

  },

  mounted () {
    this.setupNetworkEngine()
    this.setup()
  },

  beforeDestroy () {
    this.stop()
    this.player && this.player.destroy()
    this.ui && this.ui.destroy()
    this.$emit("exit", this.video)
  }
}
</script>

<style lang="scss">

.movie-player {

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  video {
    width: 100%;
    height: 100%;
    display: block;

    &::-webkit-media-text-track-display {
      top: auto !important;
      bottom: rem(20);
      transition: margin 0.6s cubic-bezier(0.4, 0, 0.6, 1);
    }

    &::cue {
      @include font(60, 80);
      text-shadow: rem(10) rem(4) rem(12) #000;
      background-color: transparent;
    }

  }

  &.progress-visible {
    video {
      &::-webkit-media-text-track-display {
        margin-bottom: rem(64);
      }
    }
  }

  &:not(.controls-visible) {
    .movie-player-controls {
      display: none;
    }
  }

  @mixin mask() {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3) center no-repeat;
    background-size: rem(200);
    z-index: 119;
    display: none;
  }
  &-controls {

  }

  &-play-button {
    position: absolute;
    bottom: rem(156);
    right: rem(104);
    width: rem(170);
    height: rem(170);
    background: none center no-repeat;
    background-size: contain;
    z-index: 110;

    &[icon=play] {
      background-image: url(https://g.smartcinemausa.com/images/acf5d3b316ab4ae3abc4fcafaee782e9-340-340.png);
    }
    &[icon=pause] {
      background-image: url(https://g.smartcinemausa.com/images/0160d3f4bda844b391a8a68cbd9015ea-340-340.png);
    }
    &[icon=buffering] {
      background-image: url(https://g.smartcinemausa.com/images/8c985d11dcc247878f342429177c1e8e-170-170.gif);
    }
  }

  &-progress-bar {
    position: absolute;
    bottom: rem(60);
    left: 0;
    right: 0;
    height: rem(4);
    z-index: 110;
  }

  &-progress-time {
    position: absolute;
    left: rem(24);
    bottom: rem(12);
    @include font(24, 40);
    font-weight: 500;
    z-index: 110;
    // color: $color-dark;
  }

  &-ended-mask {
    @include mask;
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

  &.ended {
    .shaka-controls-container {
      display: none !important;
    }

  }
}

</style>
