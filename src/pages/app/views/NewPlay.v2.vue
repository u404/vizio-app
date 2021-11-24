<template>
  <div class="play" tabindex="0" aria-label="playing">
    <transition name="fade">
      <div class="film-infos" v-show="!videoEnded && filmInfoVisible">
        <div class="film-name">{{film.filmName}}</div>
        <div class="film-labels">{{film.filmDesc}}</div>
        <div class="film-desc">{{film.introduction}}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex"

import { keyCodeMap } from "@/common/posEngine"
import posEngineMixin from "@/common/posEngineMixin"

import store from "../store"
import services from "../services"

import InfiniteLoading from "@/components/InfiniteLoading/index"
import PlayerHelper from "../components/PlayerHelper.v2"

export default {
  mixins: [posEngineMixin],
  props: {
    id: String
  },
  data () {
    return {
      filmInfoVisible: false,
      videoPaused: true,
      videoEnded: false
    }
  },
  computed: {
    ...mapState(["queryData", "tempFilmSku", "tempFilmInfo"]),
    film () {
      return this.tempFilmInfo || {}
    }
  },
  methods: {
    ...mapActions(["loadFilmInfo"]),

    onPosEngineKeyDown ({ keyCode }, next) {
      if (PlayerHelper.adPlayer.visible) {
        if ([keyCodeMap.up, keyCodeMap.down, keyCodeMap.left, keyCodeMap.right, keyCodeMap.ok].indexOf(keyCode) > -1) {
          if (this.filmInfoVisible) {
            this.showFilmInfo(false)
          } else {
            this.showFilmInfo(true)
          }
          return
        }
      } else if (PlayerHelper.player.visible) {
        if (keyCode === keyCodeMap.up || keyCode === keyCodeMap.down) {
          if (!this.videoPaused) {
            if (this.filmInfoVisible) {
              this.showFilmInfo(false)
            } else {
              this.showFilmInfo(true)
            }
          }
          return
        }
      }

      next()
    },

    onBeforeBack () {
      const loadedData = PlayerHelper.reportLoading(null, false, true)
      if (PlayerHelper.loading.showing()) {
        PlayerHelper.loading.hide()
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
          extras: this.tempFilmInfo
        })
      }
      if (this._playingAd) {
        PlayerHelper.report("vizio_ads_video_play_stop", { ...PlayerHelper._playingAd, stop_type: "用户退出" })
        PlayerHelper._playingAd = null
      }
    },

    onBeforeExit () {
      const loadedData = PlayerHelper.reportLoading(null, false, -1)
      if (PlayerHelper.loading.showing()) {
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
          extras: this.tempFilmInfo
        })
      }
      if (PlayerHelper._playingAd) {
        PlayerHelper.report("vizio_ads_video_play_stop", { ...PlayerHelper._playingAd, stop_type: "用户退出" })
        PlayerHelper._playingAd = null
      }
    },

    loadData () {
      return new Promise((resolve, reject) => {
        if (this.tempFilmSku === this.id) {
          resolve()
          return
        }
        InfiniteLoading.show()
        PlayerHelper.reportLoading("接口")
        store.commit("setState", { tempFilmSku: this.id, tempFilmInfo: null })

        this.loadFilmInfo()
          .then(() => {
            InfiniteLoading.hide()
            PlayerHelper.reportLoading("接口", false)
            if (this.tempFilmInfo.hasTicket) {
              resolve()
            } else {
              this.$alert("No Tickets Available.")
              reject(new Error("No Tickets Available."))
            }
          }).catch((err) => {
            InfiniteLoading.hide()
            PlayerHelper.reportLoading("接口", false)
            this.$alert("Loading failed.")
            store.commit("setState", { tempFilmSku: null, tempFilmInfo: null })
            reject(err)
          })
      })
    },

    showFilmInfo (show = true, autoHide = false) {
      this.filmInfoVisible = show
      this.filmInfoVisibleTimer_ && clearTimeout(this.filmInfoVisibleTimer_)
      if (autoHide) {
        this.filmInfoVisibleTimer_ = setTimeout(() => {
          this.filmInfoVisible = false
        }, 3000)
      }
    },

    initPlayer () {
      let firstPlay = true

      PlayerHelper.onBack = () => this.onBack()
      PlayerHelper.onAdPlay = () => {
        this.showFilmInfo(true, true)
      }
      PlayerHelper.onAdEnd = () => {
        this.showFilmInfo(true)
      }
      PlayerHelper.onPlay = () => {
        if (firstPlay) {
          firstPlay = false
          this.showFilmInfo(true, true)
        } else {
          this.showFilmInfo(false)
        }
        this.videoPaused = false
      }
      PlayerHelper.onPause = () => {
        this.showFilmInfo(true)
        this.videoPaused = true
      }
      PlayerHelper.onEndStateChange = (e) => {
        this.videoEnded = e
      }
      PlayerHelper.setBaseData(this.tempFilmSku, this.tempFilmInfo)
      PlayerHelper.start()
      this.$el.focus()
      PlayerHelper.logProgress(0, { currentTime: this.tempFilmInfo.playProgress || 0 }) // 进入播放页时，立即报一次播放
      PlayerHelper.report("vizio_film_play_enter")
    }

  },

  beforeMount () {

  },

  async mounted () {
    this.cancel = false
    await this.loadData()
    if (this.cancel) return
    this.initPlayer()
  },
  beforeDestroy () {
    this.cancel = true
    PlayerHelper.stop()
    PlayerHelper.clearBaseData()
    this.showFilmInfo(false)
  }
}
</script>

<style lang="scss" scoped>

.play {
  padding: 0 !important;
  height: 100vh;
  background: #000;
  position: relative;
  .film-infos {
    position: absolute;
    left: 0;
    bottom: 0;
    padding: 0 rem(100);
    width: 100%;
    height: rem(651);
    color: #ffffff;
    z-index: 101;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
    text-shadow: 0px rem(2) rem(12) rgba(0, 0, 0, 0.2);
    .film-name {
      @include font(65, 90);
      font-weight: 600;
    }
    .film-labels {
      margin-top: rem(33);
      @include font(40, 56);
      font-weight: 500;
    }
    .film-desc {
      margin-top: rem(27);
      width: rem(820);
      @include font(36, 56);
      @include text-line-clamp(4);
    }
  }
}
</style>
