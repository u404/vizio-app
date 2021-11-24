<template>
  <div class="play" tabindex="0" aria-label="playing"></div>
</template>

<script>
import Vue from "vue"
import { mapState } from "vuex"

import posEngineMixin from "@/common/posEngineMixin"

import store from "../store"
import services from "../services"

import PlayerHelper from "../components/PlayerHelper"

export default {
  mixins: [posEngineMixin],
  props: {
    id: String
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState(["queryData", "tempFilmSku", "tempFilmDetail", "tempPlayInfo"])
  },
  methods: {

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
          extras: this.tempPlayInfo
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
          extras: this.tempPlayInfo
        })
      }
      if (PlayerHelper._playingAd) {
        PlayerHelper.report("vizio_ads_video_play_stop", { ...PlayerHelper._playingAd, stop_type: "用户退出" })
        PlayerHelper._playingAd = null
      }
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

    Promise.all([store.dispatch("loadFilmDetail"), store.dispatch("loadPlayInfo")])
      .then(() => {
        $loading.close()
        if (store.state.tempPlayInfo.hasTicket) {
          next()
        } else {
          $loading.close()
          $alert("No Tickets Available.")
          next(false)
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
    PlayerHelper.onBack = () => this.onBack()
    PlayerHelper.setBaseData(this.tempFilmSku, this.tempFilmDetail, this.tempPlayInfo)
    PlayerHelper.start()
    this.$el.focus()
    PlayerHelper.report("vizio_film_play_enter")
  },
  beforeDestroy () {
    PlayerHelper.stop()
    PlayerHelper.clearBaseData()
  }
}
</script>

<style lang="scss" scoped>

.play {
  padding: 0 !important;
  height: 100vh;
  background: #000;

}
</style>
