<template>
  <div class="player-container">
    <video class="player-video" ref="video" autoplay controls></video>
  </div>
</template>

<script>

export default {
  props: {
    src: String,
    assetId: String
  },

  data () {
    return {
    }
  },

  watch: {
    src () {
      this.setSrc()
    }
  },

  methods: {

    setSrc () {
      this.player.setProtectionData({
        "com.widevine.alpha": {
          "serverURL": `https://api.smartcinemausa.com/drm/getDrmInfo?platform=shaka&uId=1&logRequestId=cdf0283272f4ef1338bd186aac8a93fa&assetId=${this.assetId}`,
          "httpRequestHeaders": {
          }
        }
      })
      this.player.attachSource(this.src)

      this.player.on(window.dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED, (e) => {
        this.player.setTextTrack(0)
      })

      this.player.on(window.dashjs.MediaPlayer.events.ERROR, (e) => {
        console.log(e)
      })
    },

    setup () {
      const video = this.video = this.$refs.video
      const player = this.player = window.dashjs.MediaPlayer().create()

      player.initialize(video)

      window.player = this.player

      this.setSrc()
    }
  },

  mounted () {
    this.setup()
  }
}
</script>

<style lang="scss">
.player {
  &-container {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
  &-video {
    width: 100%;
    height: 100%;

    &::-webkit-media-text-track-container {
      // line-height: 48px;
      // font-size: 36px !important;

    }
    &::-webkit-media-text-track-display {
      padding-bottom: 1%;
    }
    &::cue {
      // padding: 10px;
      // font-size: 36px;
      background-color: transparent;
      text-shadow: 2px 2px 5px rgba(0,0,0,0.9);
    }
  }

}
</style>
