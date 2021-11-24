<template>
  <div class="shaka-player-container" data-shaka-player-container data-shaka-player-cast-receiver-id="7B25EC44">
    <video class="shaka-player-video" ref="video" data-shaka-player autoplay></video>
    <!-- <div class="ad-container" ref="adContainer" v-show="adPlaying"></div> -->
  </div>
</template>

<script>
import shaka from "shaka"

export default {
  props: {
    src: String
  },

  data () {
    return {
      adPlaying: false,
      adPlayed: false
    }
  },

  methods: {

    getAds (container, player, video) {
      const adManager = player.getAdManager()
      adManager.initClientSide(container, video)

      console.log("adManager", adManager)

      return {
        request (url) {
          const adsRequest = new window.google.ima.AdsRequest()
          adsRequest.setAdWillAutoPlay(true)
          adsRequest.setContinuousPlayback(true)
          adsRequest.adTagUrl = url
          adManager.requestClientSideAds(adsRequest)
        },
        on (event, handler) {
          adManager.addEventListener(event, handler)
        },
        off (event, handler) {
          adManager.removeEventListener(event, handler)
        }
      }
    },

    setup () {
      console.log("video-------", shaka)
      const video = this.video = this.$refs.video

      const ui = video["ui"]
      const controls = ui.getControls()
      const player = this.player = controls.getPlayer()
      const adContainer = controls.getControlsContainer()

      // const player = this.player = new window.shaka.Player(video)
      // const adContainer = this.$refs.adContainer

      const ads = this.getAds(adContainer, player, video)

      ads.on("ad-loaded", (e) => {
        console.log("ad-loaded", e.originalEvent.getAdData())
        this.adPlaying = true
        this.adPlayed = true
      })

      ads.on("ad-progress", (e) => {
        console.log("ad-progress", e.originalEvent.getAdData())
      })

      ads.on("ad-complete", (e) => {
        console.log("ad-complete", e)
        this.adPlaying = false
      })

      player.configure({
        drm: {
          servers: {
            "com.widevine.alpha": localStorage.drm || "https://api-test.smartcinema.com.tw/drm/getDrmInfo?platform=shaka&uId=1&logRequestId=cdf0283272f4ef1338bd186aac8a93fa&assetId=lFeQtVYbRzuyqcUhITSAJksHPDoCEiKx"
            // "com.microsoft.playready": "https://foo.bar/drm/playready"
          }
        }
      })

      player.load(this.src).then(res => {
        console.log("src loaded")
        video.play()
      }).catch(err => {
        console.log("src load error: ", err)
      })

      // video.addEventListener("timeupdate", () => {
      //   console.log(video.currentTime)
      //   if (!this.adPlayed && video.currentTime >= 3) {
      //     // 测试链接
      //     // ads.request("https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=")

      //     // 由vizio 提供的
      //     // ads.request("https://vid.springserve.com/rt/1385?w=1920&h=1080&cb=[Replace_with_Cachebuster_Macro]&ip=[REPLACE_with_IP_macro]&ua=[REPLACE_with_USER_AGENT_macro]&did=[Replace_with_dynamic_IFA_value_from_JSON]&ifa_type=[Replace_with_IFA_TYPE_value_from_JSON]&dnt=[Replace_with__LMT__value_from_JSON]&app_bundle=vizio.smartcinema&app_name=SmartCinema&genre=entertainment&appId=hoaoit9b")
      //   }
      // })

      const playAd = () => {
        console.log("start play")
        ads.request("https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=")
        // ads.request("https://vid.springserve.com/rt/1385?w=1920&h=1080&cb=cb01&ip=127.0.01&ua=ua&did=did&ifa_type=ifa_type&dnt=dnt&app_bundle=vizio.smartcinema&app_name=SmartCinema&genre=entertainment&appId=hoaoit9b")
        video.removeEventListener("play", playAd)
      }

      video.addEventListener("play", playAd)

      player.addEventListener("error", (error) => {
        console.error("Error code", error.code, "object", error)
      })

      shaka.Player.probeSupport().then(support => {
        console.log("支持属性", support)
      }).catch(err => {
        console.log("error", err)
      })

      window.addEventListener("keyup", (e) => {
        console.log("keycode", e.keyCode)
        if (e.keyCode === 8) {
          window.VIZIO.exitApplication()
        } else if (e.keyCode === 13) {
          if (video.paused) {
            video.play()
          } else {
            video.pause()
          }
        } else if (e.keyCode === 38) {
          console.log(e.keyCode)
          const event = document.createEvent("MouseEvents")
          event.initEvent("click", true, true)
          document.querySelector(".vc-switch").dispatchEvent(event)
        } else if (e.keyCode === 40) {
          const event = document.createEvent("MouseEvents")
          event.initEvent("click", true, true)
          document.querySelector(".vc-hide").dispatchEvent(event)
        } else if (e.keyCode === 39) {
          video.currentTime += 10
        } else if (e.keyCode === 37) {
          video.currentTime -= 10
        }
      })
    }
  },

  mounted () {
    // console.log("mouted")
    document.addEventListener("shaka-ui-loaded", () => this.setup())
    // this.setup()
  }
}
</script>

<style lang="scss">
.shaka-player {
  &-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    .ad-container {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
    }
  }
  &-video {
    width: 100%;
    height: 100%;
  }

}
</style>
