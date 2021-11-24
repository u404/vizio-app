<template>
  <div class="player-container">
    <video class="video-js" ref="video" autoplay></video>
  </div>
</template>

<script>
import "video.js/dist/video-js.css"
import videojs from "video.js"

import "videojs-contrib-dash"

export default {
  props: {
    src: String,
    assetId: String
  },

  data () {
    return {

      options: {
        controls: true,
        textTrackSettings: false,
        html5: {
          nativeCaptions: false
        }
      },

      ready: false
    }
  },

  watch: {
    src () {
      this.setSrc()
    }
  },

  methods: {

    setSrc () {
      if (!this.ready) return
      this.player.src({
        src: this.src,
        type: "application/dash+xml",
        keySystemOptions: [
          {
            name: "com.widevine.alpha",
            options: {
              serverURL: `https://api.smartcinemausa.com/drm/getDrmInfo?platform=shaka&uId=1&logRequestId=cdf0283272f4ef1338bd186aac8a93fa&assetId=${this.assetId}`
            }
          }
        ]
      })
    },

    setup () {
      const video = this.video = this.$refs.video
      const player = this.player = videojs(video, this.options, () => {
        console.log("onPlayerReady")
        this.ready = true
        this.$emit("ready")
      })

      this.$on("ready", () => {
        this.setSrc()
      })

      player.on("texttrackchange", (e) => {
        player.textTracks()[0].mode = "showing"
        console.log("textTracks", player.textTracks()[0])
      })

      player.on("error", (err) => {
        console.log(err)
      })
    }
  },

  mounted () {
    this.setup()
  },

  beforeDestroy () {
    this.player && this.player.dispose()
  }
}
</script>

<style lang="scss">
.player-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  .video-js {
    width: 100%;
    height: 100%;
  }
}
</style>
