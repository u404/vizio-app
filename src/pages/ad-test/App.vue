<template>
  <div class="page">
    <div class="flex infos">
      <div class="info">请求次数：{{completeTimes}}</div>
      <div class="info" style="color: #3f3;">成功次数：{{successTimes}}</div>
      <div class="info" style="color: #f33;">失败次数：{{failedTimes}}</div>
    </div>

    <div class="flex controls">
      <div class="control">总次数：<input type="text" v-model="totalTimes" /></div>
      <div class="control">间隔时间：<input type="text" v-model="nextDelay" /></div>
      <div class="control">
        <div class="btn" @click="startTest" v-show="!execing">启动测试</div>
        <div class="btn" @click="stopTest" v-show="execing">停止测试</div>
      </div>
    </div>
    <table class="error-list">
      <tr class="error">
        <th class="error-col">错误码</th>
        <th class="error-col">错误次数</th>
        <th class="error-col">错误描述</th>
        <th class="error-col">错误时间记录</th>
      </tr>
      <tr class="error" v-for="(error, i) in errorTypes" :key="i">
        <td class="error-col">{{error.errorCode}}</td>
        <td class="error-col">{{error.times}}</td>
        <td class="error-col">{{error.errorMessage}}</td>
        <td class="error-col time-col">{{error.time}}</td>
      </tr>
    </table>
    <div class="bottom">
      <video class="ad-player-video" ref="video" autoplay></video>
      <div class="ad-container" ref="adContainer"></div>
    </div>
  </div>
</template>

<script>
import { getUUID, queryString } from "@sc/lib-web-utils-intl"
import { getDeviceId, event, Chromevox, getAdvertiserID, getIP } from "@/common/vizioHelper"

const google = window.google

const queryData = queryString.parse(location.search)

export default {
  data () {
    return {
      nextDelay: queryData.delay ? +queryData.delay : 0,
      totalTimes: queryData.totalTimes ? +queryData.totalTimes : 999999,
      completeTimes: 0,
      successTimes: 0,
      failedTimes: 0,
      errorTypes: [],
      execing: false,
      inited: false
    }
  },

  methods: {
    init (success = () => {}) {
      this.inited = true
      if (this.completeTimes >= this.totalTimes) return
      const video = this.$refs.video
      const adContainer = this.$refs.adContainer
      const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, video)
      const adsLoader = this.adsLoader = new google.ima.AdsLoader(adDisplayContainer)

      const adsRequest = this.adsRequest = new google.ima.AdsRequest()

      adsRequest.setAdWillAutoPlay(true)
      // adsRequest.setContinuousPlayback(true)
      adsRequest.vastLoadTimeout = 10000 // vast 加载超时事件，默认5000ms

      adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        () => {
          this.completeTimes += 1
          this.successTimes += 1
          this.timer = setTimeout(success, this.nextDelay * 1000)
        },
        false)
      adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        (e) => {
          this.completeTimes += 1
          this.failedTimes += 1
          const error = e.getError().g
          let existed = this.errorTypes.find(et => et.errorCode === error.errorCode)

          if (existed) {
            existed.times += 1
            existed.time += ", " + new Date().format("hh:mm:ss")
            this.errorTypes = [...this.errorTypes]
          } else {
            error.times = 1
            error.time = new Date().format("hh:mm:ss")
            this.errorTypes.push(error)
          }

          console.log(error)
          this.timer = setTimeout(success, this.nextDelay * 1000)
        },
        false)

      getAdvertiserID().then(({ IFA, IFA_TYPE, LMT }) => {
        adsRequest.adTagUrl = `https://vid.springserve.com/rt/1385?w=1920&h=1080&cb=${getUUID(16)}&ip=${getIP()}&ua=${encodeURIComponent(window.navigator.userAgent)}&did=${IFA}&ifa_type=${IFA_TYPE}&dnt=${LMT}&app_bundle=vizio.smartcinema&app_name=SmartCinema&genre=entertainment&appId=hoaoit9b`

        success()
      })
    },

    requestOnce () {
      if (!this.execing) return
      this.adsLoader.requestAds(this.adsRequest)
    },

    startTest () {
      this.execing = true
      if (!this.inited) {
        this.init(() => this.requestOnce())
      } else {
        this.requestOnce()
      }
    },

    stopTest () {
      this.execing = false
      if (this.timer) {
        this.timer = clearTimeout(this.timer)
        this.timer = null
      }
    }
  },

  beforeMount () {

  },
  mounted () {
    window.addEventListener("keypress", e => {
      console.log("按键：", e.keyCode)
      if (e.keyCode === 13) {
        if (this.execing) {
          this.stopTest()
        } else {
          this.startTest()
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  font-size: rem(40);
  color: #ffb;
  @include flex(column, center);
  video {
    display: block;
    width: 0;
    height: 0;
  }
  input {
    width: 5em;
    height: 2em;
    border: 0 none;
  }
  .flex {
    margin: rem(30);
    @include flex;
  }
  .btn {
    width: 5em;
    height: 2em;
    background: #00ce0e;
    border-radius: rem(10);
  }

  .control {
    margin: 0 rem(30);
  }

  .infos {
    border: 1px solid #ccc;
    border-left: 0 none;

    .info {
      border-left: 1px solid #ccc;
      padding: rem(20) rem(30);
      font-size: rem(40);
    }
  }

  .error-list {
    border: 1px solid #ccc;
    border-collapse: collapse;
    .error {
      font-size: rem(30);
      .error-col {
        padding: rem(10) rem(10);
        border: 1px solid #ccc;
        text-align: center;
        &:nth-child(1) {
          min-width: rem(120);
        }
        &:nth-child(2) {
          min-width: rem(150);
        }
        &:nth-child(3) {
          min-width: rem(320);
        }
      }

      .time-col {
        font-size: rem(16);
      }
    }

  }
}
</style>
