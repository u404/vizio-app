<template>
  <h5-fail-panel v-if="error"></h5-fail-panel>
  <h5-loading-panel v-else-if="loading"></h5-loading-panel>
  <div class="page" v-else>
    <Player :src="src" :assetId="assetId" />
  </div>
</template>

<script>
import Player from "./components/Player"

// import manifest from "./manifest.json"

// manifest.loadedTime = new Date()

// const manifest = mpd2json.parse(mpd, "https://aws-smart-prod-dash.smartcinemausa.com/xgqs-160553759248253169/160555740057941326/")

// const manifest = null

export default {
  components: {
    Player
  },
  data () {
    return {
      error: false,
      loading: true,

      // src: manifest || "https://aws-smart-prod-dash.smartcinemausa.com/xgqs-160553759248253169/160555740057941326/Manifest.mpd",
      src: "",
      assetId: "zdpsiuPtNXknlKYIWcZjUeDJwOrMCxTL",
      test: null
    }
  },

  methods: {
  },

  beforeMount () {
    this.loading = false
    window.DashjsMpdLoader.load("https://aws-smart-prod-dash.smartcinemausa.com/xgqs-160553759248253169/160555740057941326/Manifest.mpd").then(res => {
      this.src = res
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
