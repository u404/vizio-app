<template>
  <div class="buy">
    <div class="header">
      <div class="title">Purchase movies</div>
      <div class="logo"></div>
    </div>
    <div class="flex-box">
      <div class="flex-item qrcode-part">
        <div class="part-title">Pay by Phone Scan QR Code</div>
        <div class="qrcode-wrap">
          <img class="qrcode" v-show="qrcode" :src="qrcode" alt="" />
        </div>
      </div>
      <div class="flex-item content-part">
        <div class="part-title">Pay by PC</div>
        <ul class="list">
          <li>Please go to <b>{{buyUrl}}</b></li>
          <li>Pay with your paypal</li>
          <li>Click back and enjoy</li>
        </ul>
      </div>
    </div>
    <div class="btns">
      <div class="btn main-btn" :data-pos-x="0" :data-pos-y="posBaseY + 0" @click="refresh()" tabindex="0" role="button" aria-label="Refresh">Refresh</div>
      <div class="btn back-btn" :data-pos-x="0" :data-pos-y="posBaseY + 1" @click="onBackClick" tabindex="0" role="button" aria-label="Back">Back</div>
    </div>
    <transition name="h5-fade" appear>
      <div class="paying-dialog" v-show="paying" ref="payingDialog" tabindex="0" :aria-label="`Dialog. ${paySuccess ? 'Paid Successfully' : 'Paying'}. Return Button`">
        <div class="dialog-body">
          <div class="paying-title">Paying</div>
          <div class="paying-icon" :class="{ success: paySuccess }"></div>
          <div class="btn close-btn" @click="hidePaying" :data-pos-x="0" :data-pos-y="0" tabindex="0" role="button" aria-label="Return">Return</div>
        </div>
        <img class="preload-image" src="https://g.smartcinemausa.com/images/4190fa11f37843a480e2607a6a0f5706-332-332.png" alt="">
        <img class="preload-image" src="https://g.smartcinemausa.com/images/799080d0d4ec48b38b1e2983d83a5192-332-332.png" alt="">
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex"
import QRCode from "qrcode"
import env from "@sc/lib-env"
import { PosEngine, keyCodeMap } from "@/common/posEngine"
import posEngineMixin from "@/common/posEngineMixin"
import { AutoRun } from "@/common/lib"
import { Chromevox } from "@/common/vizioHelper"

import services from "../services"

const baseUrl = env.env === "prod" ? "smartcinemausa.com/tv/" : `${location.hostname || location.host}/tv.html?code=`

export default {
  mixins: [posEngineMixin],

  props: {
    id: Number
  },

  data () {
    return {
      code: "",
      qrcode: "",
      paying: false,
      paySuccess: false
    }
  },

  computed: {
    ...mapState(["tempFilmSku", "tempFilmInfo"]),
    buyUrl () {
      return `${baseUrl}${this.code}`
    }
  },

  watch: {
    tempFilmInfo: {
      immediate: true,
      handler (v) {
        if (v && v.hasTicket) {
          this.paySuccessHandler()
        }
      }
    }
  },

  methods: {
    ...mapMutations(["setState"]),
    ...mapActions(["autoUpdateFilmInfo"]),
    refresh (init = false) {
      this.$loading()
      this.autoGetPayCodeStatus(false)
      return services.createPayCode(this.id).then(res => {
        this.code = res.code
        QRCode.toDataURL(this.buyUrl, {
          margin: 1,
          errorCorrectionLevel: "H"
        }).then(qrcode => {
          this.qrcode = qrcode
        })
        if (!init) {
          // this.report("vizio_buy_code_page_newcode")
        }
        this.autoGetPayCodeStatus(true)
        this.$loading.close()
      }).catch(() => {
        this.$loading.close()
        this.$alert("load failed. please try to refresh")
        Chromevox().play("load failed. please try to refresh")
      })
    },

    autoGetPayCodeStatus (enabled = true) {
      if (this._autoRunGetPayCodeStatus) {
        this._autoRunGetPayCodeStatus.cancel()
        this._autoRunGetPayCodeStatus = null
      }

      if (enabled) {
        const fn = () => services.getPayCodeStatus(this.code).catch(() => null).then(res => {
          if (res) {
            if (res.status === 1) {
              return
            }
            if (res.status === 2) {
              this.showPaying()
            }
            throw new Error()
          }
        })
        this._autoRunGetPayCodeStatus = new AutoRun(fn, 1000)
      }
    },

    showPaying () {
      if (this.paying) return
      this.paying = true
      this.$nextTick(() => {
        if (!this.childPosEngine) {
          this.childPosEngine = new PosEngine(this.$refs.payingDialog)
        }
        this.posEngine.disable()
        this.childPosEngine.bind({
          pos: { x: 0, y: 0 },
          onKeyDown: ({ keyCode }, next) => {
            if (keyCode === keyCodeMap.back) {
            } else {
              next()
            }
          }
        })
        this.childPosEngine.enable()
        this.$refs.payingDialog.focus()
      })
    },

    hidePaying () {
      this.paying = false
      this.childPosEngine && this.childPosEngine.disable()
      this.posEngine.enable()
      if (this.paySuccess) {
        this.onBack()
      } else {
        this.refresh()
      }
    },

    paySuccessHandler () {
      this.paySuccess = true
      this.showPaying()
      this.autoUpdateFilmInfo(false)
    },

    report (event) {
      this.$reporter.track(event, { sku_id: this.id, film_name: this.tempFilmInfo && decodeURIComponent(this.tempFilmInfo.filmName) })
    },

    onBackClick () {
      this.onBack()
    }
  },

  async mounted () {
    if (this.tempFilmSku !== this.id) {
      this.setState({ tempFilmSku: this.id, tempFilmInfo: null })
    }
    this.autoUpdateFilmInfo(true)
    await this.refresh(true)
    this.report("vizio_pay_select_page")
  },

  beforeDestroy () {
    this.autoGetPayCodeStatus(false)
    this.autoUpdateFilmInfo(false)
    if (this.childPosEngine) {
      this.childPosEngine.destroy()
      this.childPosEngine = null
    }
  }
}
</script>

<style lang="scss" scoped>

@keyframes rotate {
  0% {

  }
  100% {
    transform: rotate(360deg);
  }
}

.buy {
  color: $color-dark;
  @include flex(column, flex-start, stretch);
  .header {
    flex: 0 0 auto;
    padding: rem(80) 0 0;
    @include flex;
    .title {
      @include font(48, 48);
      font-weight: 500;
    }
    .logo {
      width: rem(411);
      height: rem(51);
      // background: url(https://g.smartcinemausa.com/images/0956678f12cd4a41abc6138efead2860-868-116.png) center no-repeat;
      background: url(https://g.smartcinemausa.com/images/59a1c17035d24ac2a2ad89d8d1660cce-822-102.png) center no-repeat;
      background-size: contain;
    }
  }
  .flex-box {
    padding-top: rem(88);
    @include flex($ali: flex-start);
  }
  .part-title {
    @include font(46, 54);
    font-weight: bold;
    text-align: center;
  }
  .qrcode-part {
    flex: 0 0 auto;
    width: 50%;
    .qrcode-wrap {
      margin: rem(63) auto 0;
      width: rem(414);
      height: rem(414);
      background: url(https://g.smartcinemausa.com/images/31274f1915754e3aa76a2c31206f5c1b-828-828.png) center no-repeat;
      background-size: contain;
      @include flex($jus: center);
      .qrcode {
        width: rem(290);
        height: rem(290);
      }
    }
  }
  .content-part {
    flex: 0 0 auto;
    width: 50%;
    border-left: 1px solid transparent;
    padding-left: rem(190);
    position: relative;
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: rem(146);
      width: rem(1);
      height: rem(350);
      background: rgba(255, 255, 255, 0.3);
    }
    // .part-title {
    //   color: #d51e2b;
    // }
    .list {
      margin-top: rem(60);
      @include font(36, 72);
      color: $color-dark2;
      list-style-type: decimal;
      li {
        margin-bottom: rem(50);
        b {
          font-weight: bold;
        }
      }
    }
  }

  .btns {
    @include flex(column, flex-start, center);
  }

  .main-btn {
    margin-top: rem(60);
    @include button;
    width: rem(300);
    height: rem(88);
    @include font(36, 55);
    font-weight: 500;
  }
  .back-btn {
    position: absolute;
    left: $page-margin;
    @include font(30, 45);
    background: url(https://g.smartcinemausa.com/images/976aa9deb87940a2bc7b9dbed6ade4c5-48-48.png) left center no-repeat;
    background-size: rem(24);
    padding-left: rem(30);
    bottom: rem(85);
  }

  .paying-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    @include flex($jus: center);
    .dialog-body {
      width: rem(880);
      height: rem(600);
      padding: rem(96);
      background: rgba(85, 85, 80, 0.95);
      border-radius: rem(12);
      @include flex(column, space-between, center);

      .paying-title {
        @include font(48, 72);
        font-weight: bold;
      }

      .paying-icon {
        width: rem(166);
        height: rem(166);
        position: relative;
        &:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url(https://g.smartcinemausa.com/images/4190fa11f37843a480e2607a6a0f5706-332-332.png) center no-repeat;
          background-size: contain;
          animation: rotate 1s linear infinite;
        }

        &.success {
          &:before {
            background-image: url(https://g.smartcinemausa.com/images/799080d0d4ec48b38b1e2983d83a5192-332-332.png);
            animation: none;
          }
        }
      }

      .btn {
        @include button;
        width: rem(360);
        height: rem(88);
        @include font(36, 55);
        font-weight: 500;
      }
    }
  }

  .preload-image {
    display: none;
  }
}
</style>
