<template>
  <div class="detail" :class="{ loading }" tabindex="0" :aria-label="`${film.filmName}. ${film.filmDesc}. ${film.introduction}. ${playInfo.hasTicket ? 'Play': 'Buy'} Button`">
    <div class="flex-box detail-content">
      <div class="film-infos">
        <div class="film-name">{{film.filmName}}</div>
        <div class="film-labels">{{film.filmDesc}}</div>
        <div class="film-desc">{{film.introduction}}</div>
      </div>
      <div class="film-preview" v-if="!queryData.nopreview">
        <video class="preview-video" autoplay loop :src="film.filmPreviewUrl" ref="previewVideo" :muted="isTTSEnabled"></video>
      </div>
    </div>
    <div class="flex-box status-content">
      <div class="flex-item">
        <!-- <div class="film-price" v-show="!loading && !film.free">$ {{film.price}}</div> -->
        <div class="film-prices" v-show="loaded && !playInfo.hasTicket">
          <div class="film-price" :class="{ 'not-important': actVisible }" v-show="!film.free">$ {{film.price}}</div>
          <div class="film-price" v-show="actVisible">$ {{film.packPrice}}</div>
        </div>
        <div class="film-btns" v-show="loaded">
          <div class="btn play-btn" data-pos-x="0" :data-pos-y="posBaseY + 0" @click="goBuyOrPlay" tabindex="0" :aria-hidden="!defaultTTSReaded" role="button" :aria-label="playBtnText">
            <i class="icon-corner" v-show="film.free || !playInfo.hasTicket" :class="{ free: film.free, config: film.extend && film.extend.buyIconUrl }" :style="{ 'background-image': film.extend && film.extend.buyIconUrl && `url(${film.extend.buyIconUrl})` || ''  }"></i>
            {{ playBtnText }}
          </div>
          <div class="btn act-btn" v-show="actVisible" data-pos-x="1" :data-pos-y="posBaseY + 0" @click="goActivity" tabindex="0" role="button" aria-label="BUNDLE & SAVE">BUNDLE & SAVE</div>
        </div>
      </div>
      <div class="flex-item flex-box">
        <div class="film-star-points">
          <div class="film-points">{{film.filmScore && film.filmScore.toFixed(1) || '5.0'}}</div>
          <ProgressStars :points="film.filmScore || 5" />
        </div>
        <ul class="film-star-rates">
          <li class="film-star-rate" v-for="i in 5" :key="i">
            <ul class="film-stars">
              <li class="film-star" v-for="j in 6 - i" :key="j"></li>
            </ul>
            <div class="rate-progress">
              <span class="progress-bar" :style="{ width: `${(film.scoreScaleList && film.scoreScaleList[i - 1] * 100 || 0)}%` }"></span>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex-box">
      <div class="btn back-btn" data-pos-x="0" :data-pos-y="posBaseY + 1" @click="onBack" tabindex="0" role="button" aria-label="Back">Back</div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex"
import ProgressStars from "@/components/ProgressStars"
import { Chromevox } from "@/common/vizioHelper"
import posEngineMixin from "@/common/posEngineMixin"

import PlayerHelper from "../components/PlayerHelper"

import services from "../services"

export default {
  mixins: [posEngineMixin],
  components: { ProgressStars },
  props: {
    id: String
  },
  data () {
    return {
      loading: true,
      loaded: false,
      film: {
        filmImagePath: "",
        filmName: "",
        filmDesc: "",
        introduction: "",
        scoreScaleList: [

        ]
      },
      tips: "",
      defaultTTSReaded: false
    }
  },

  computed: {
    ...mapState(["tempPlayInfo", "isTTSEnabled", "queryData"]),
    playInfo () {
      return this.tempPlayInfo || {}
    },
    actVisible () {
      return this.film.isInPack && !this.playInfo.hasTicket
    },
    playBtnText () {
      return this.playInfo.hasTicket ? "Play" : (this.actVisible ? "SINGLE MOVIE" : "Buy")
    }
  },

  watch: {
    playInfo: {
      immadiate: true,
      handler (v) {
        if (v.hasTicket) {
          PlayerHelper.player.preload(v.videoUrl)
        }
      }
    }
  },

  methods: {
    ...mapMutations(["setState"]),
    ...mapActions(["loadPlayInfo", "autoUpdatePlayInfo"]),
    goBuyOrPlay () {
      if (!this.loaded) return

      if (this.playInfo.hasTicket) {
        this.$router.push({ name: "play", params: { id: this.id } })
      } else {
        this.$router.push({ name: "buy", params: { id: this.id } })
      }
      this.report("vizio_film_detail_clickbtn", { btn_text: this.playInfo.hasTicket ? "Play" : "购买" })
    },

    goActivity () {
      location.href = this.film.packJumpLink
      this.report("vizio_film_detail_clickbtn", { btn_text: "影片合集" })
    },

    loadFilmDetail () {
      return services.getFilmDetail(this.id).then(res => {
        const promise = new Promise(resolve => {
          if (this.queryData.delay_tts) {
            const { previewVideo } = this.$refs
            const handler = () => {
              console.log("preview-play")
              setTimeout(() => resolve(), +this.queryData.delay_tts || 0)
              previewVideo.onplay = null
              previewVideo.onerror = null
            }
            previewVideo.onplay = handler
            previewVideo.onerror = handler
          } else {
            resolve()
          }
        })

        this.film = res
        this.setState({ tempFilmDetail: res })
        this.loading = false
        this.report("vizio_film_detail_enter")

        return promise
      })
    },

    getFilmData () {
      this.$loading()
      this.setState({ tempFilmSku: this.id })
      Promise.all([this.loadFilmDetail(), this.loadPlayInfo()])
        .then(() => {
          this.loaded = true
          this.$nextTick(() => {
            this.posEngine.moveTo({ x: 0, y: 0 })
            this.$el.focus()
            this.defaultTTSReaded = true
          })
          if (!this.playInfo.hasTicket) {
            this.autoUpdatePlayInfo(true)
          }
        })
        .catch(() => {
          this.$alert("load fail! please back and retry.")
          Chromevox().play("load failed. please back and retry.")
        })
        .then(() => {
          this.$loading.close()
        })
    },

    report (name, data) {
      this.$reporter.track(name, { sku_id: this.id, film_name: this.film.filmName, ...data })
    }
  },

  beforeMount () {
    this.getFilmData()
  },
  mounted () {
    PlayerHelper.adPlayer.preload()
  },
  beforeDestroy () {
    this.autoUpdatePlayInfo(false)
    this.$refs.previewVideo && (this.$refs.previewVideo.src = "")
    PlayerHelper.clearBaseData() // 由于广告加载是提前的，埋点事件会加入事件队列，直到进入播放页才上报。如果用户不进入播放页，则需要清理事件队列
  }
}
</script>

<style lang="scss" scoped>
.detail {
  padding: $page-margin !important;
  padding-bottom: rem(94) !important;
  position: relative;
  @include flex(column, flex-start, stretch);
  .flex-box {
    flex: 0 0 auto;
    @include flex($jus: space-between, $ali: stretch);
  }
  .detail-content {
    flex: 1 1 auto;

    .film-preview {
      flex: 0 0 auto;
      width: rem(866);
      height: rem(487);
      position: relative;
      overflow: hidden;

      .preview-video {
        display: block;
        width: rem(866);
        height: rem(487);
        object-fit: contain;
      }
      &::before {
        content: "";
        position: absolute;
        left: rem(-192);
        top: rem(-120);
        width: rem(364);
        height: rem(1080);
        background: url(https://g.smartcinemausa.com/images/40487d91eab041bb94527949329b2b5f-728-2160.png) center no-repeat;
        background-size: contain;
        // background: #121212;
        // filter: blur(rem(36));
      }
      &::after {
        content: "";
        position: absolute;
        right: rem(-120);
        top: rem(-120);
        width: rem(292);
        height: rem(1080);
        background: url(https://g.smartcinemausa.com/images/d8850876b12b4ec7adb70584746c0078-584-2160.png) center no-repeat;
        background-size: contain;
        // background: #121212;
        // filter: blur(rem(36));
      }
    }
    .film-infos {
      margin-right: rem(10);
      flex: 1 1 auto;
      color: $color-dark;
      font-weight: 400;
      @include flex(column, flex-start, stretch);
      position: relative;
      z-index: 1;
    }
    .film-name {
      flex: 0 0 auto;
      margin-top: rem(-12);
      @include font(48, 72);
      font-weight: bold;
      @include text-line-clamp(2);
    }
    .film-labels {
      flex: 0 0 auto;
      margin-top: rem(36);
      @include font(30, 45);
      color: $color-dark2;
      @include text-line-clamp(2);
    }
    .film-desc {
      flex: 0 0 auto;
      margin-top: rem(50);
      @include font(28, 50);
      @include text-line-clamp(5);
    }
  }
  .status-content {
    margin-top: rem(30);
    align-items: flex-end;

    .film-prices {
      @include flex($jus: flex-start);
      .film-price {
        margin-right: rem(30);
        width: rem(280);
        @include font(48, 58);
        font-weight:bold;
        color: #FF4062;
        &.free {
          @include font(40, 58);
        }

        &.not-important {
          color: #FFFFFF;
        }
      }
    }

    .film-btns {
      margin-top: rem(30);
      margin-bottom: rem(10);
      flex: 0 0 auto;
      @include flex($jus: flex-start);
      .btn {
        @include button;
        position: relative;

        .icon-corner {
          position: absolute;
          &.free {
            left: rem(-37);
            top: rem(-42);
            width: rem(108);
            height: rem(108);
            background: url(https://g.smartcinemausa.com/images/58188e130e9f48768ca0c08eb34ba0dc-216-216.png) center no-repeat;
            background-size: contain;
          }
          &.config {
            left: rem(-40);
            top: rem(-40);
            width: rem(140);
            height: rem(140);
            background: none center no-repeat;
            background-size: contain;
          }
        }

      }

    }

    .film-star-points {
      margin-right: rem(52);
      @include flex(column, flex-start, center);
      .film-points {
        margin-bottom: rem(30);
        @include font(170, 170);
        font-weight: bold;
        color: $color-dark;
      }
    }
    .film-star-rates {
      margin-top: rem(20);
      .film-star-rate {
        margin-bottom: rem(10);
        @include flex($jus: flex-end, $ali: center);
        .film-stars {
          @include flex($jus: flex-end);
          .film-star {
            margin-left: rem(8);
            width: rem(19);
            height: rem(18);
            background: url(https://g.smartcinemausa.com/images/8860ece107bc407f931ee706c07a9648-54-52.png) center no-repeat;
            background-size: contain;
            filter: saturate(0);

            &:first-child {
              margin-left: 0;
            }
          }
        }

        .rate-progress {
          margin-left: rem(10);
          width: rem(320);
          height: rem(6);
          border-radius: rem(5);
          background: rgba(255, 255, 255, 0.38);
          .progress-bar {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: rem(5);
            background: $color-dark;
          }
        }
      }
    }
  }
  .back-btn {
    margin-top: rem(20);
    @include font(30, 45);
    background: url(https://g.smartcinemausa.com/images/976aa9deb87940a2bc7b9dbed6ade4c5-48-48.png) left 55% no-repeat;
    background-size: rem(24);
    padding-left: rem(30);
  }

  &.loading {
    .detail-content {
      .film-name:before {
        content: "";
        display: inline-block;
        width: rem(500);
        height: rem(48);
        background: $color-text-loading;
      }
      .film-labels:before {
        content: "";
        display: inline-block;
        width: 100%;
        height: rem(30);
        background: $color-text-loading;
      }
      .film-desc {
        height: rem(250);
      }
      .film-desc:before {
        content: "";
        display: inline-block;
        width: 100%;
        height: rem(28);
        background: $color-text-loading;
        box-shadow: 0 rem(50) 0 $color-text-loading,
            0 rem(100) 0 $color-text-loading,
            0 rem(150) 0 $color-text-loading,
            0 rem(200) 0 $color-text-loading;
      }

    }
  }
}
</style>
