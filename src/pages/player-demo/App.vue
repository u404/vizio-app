<template>
  <h5-fail-panel v-if="error"></h5-fail-panel>
  <h5-loading-panel v-else-if="loading"></h5-loading-panel>
  <div class="page" v-else>
    <Player :src="src" />
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex"
import { countdownEx, callAppUI, callApp, callAppHelper, callAppPage, getPosition } from "@sc/lib-web-utils-intl"
import libUser from "@sc/lib-user"
import libShare from "@sc/lib-share"

import Player from "./components/Player"

export default {
  components: {
    Player
  },
  data () {
    return {
      error: false,
      loading: true,

      src: "https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd",
      // src: "https://us-smart-prod-dash.smartcinemausa.com/fcdyjypxy-159220512870694582/159220683624697085/Manifest.mpd",
      // src: "https://us-smart-prod-dash.oss-accelerate.aliyuncs.com/fcdyjypxy-159220512870694582/159220683624697085/Manifest.mpd",
      // src: localStorage.src || "https://us-smart-test-dash.smartcinemausa.com/zbsy-159419072284652097/159419111920514378/Manifest.mpd",
      // src: "https://voda-fad-m3u8.huanxi.com/d0aabd6f2d9d10fb2fd25b9247b82207/1592903276/vod/0136355c-52ae-48f4-8eec-79937e9802c4.m3u8?pt=1&dt=1&ra=1&https=1&bi=-1&hxcd=2182ce9384101ac14214fa34f168d2&uid=0&hxpid=85672695&cnll=1&ct=1592903276&vn=5.6&mid=44035&seid=34393170&onit=84551426&platform=16?pt=2&dt=3&ra=1",
      // src: "https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8",
      test: null
    }
  },

  methods: {
    ...mapMutations(["setState"]),
    ...mapActions(["getBaseData"])
  },

  beforeMount () {
    this.getBaseData().then(() => {
      this.loading = false
    }).catch(() => {
      this.loading = false
      this.error = true
    })
  },

  mounted () {
  }

}
</script>

<style lang="scss">
.page {
}
</style>
