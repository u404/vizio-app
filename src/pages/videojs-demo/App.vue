<template>
  <h5-fail-panel v-if="error"></h5-fail-panel>
  <h5-loading-panel v-else-if="loading"></h5-loading-panel>
  <div class="page" v-else>
    <Player :src="src" :assetId="assetId" />
  </div>
</template>

<script>
import Player from "./components/Player"

export default {
  components: {
    Player
  },
  data () {
    return {
      error: false,
      loading: true,

      src: "https://aws-smart-prod-dash.smartcinemausa.com/xgqs-160553759248253169/160555740057941326/Manifest.mpd",
      assetId: "zdpsiuPtNXknlKYIWcZjUeDJwOrMCxTL",
      test: null
    }
  },

  methods: {
  },

  beforeMount () {
    this.loading = false
  },

  mounted () {
  }

}
</script>

<style lang="scss">
.page {
}
</style>
