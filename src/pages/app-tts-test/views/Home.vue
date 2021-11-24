<template>
  <div class="home">
    <YScroll>
      <div class="film-swiper-box" :data-pos-x="0" :data-pos-y="1" @click="onBannerItemClick(swiperFilms[swiperIndex], swiperIndex)" tabindex="0" role="banner" :aria-label="swiperFilms[swiperIndex] && swiperFilms[swiperIndex].bannerDesc || ''">
        <swiper class="film-swiper" ref="mySwiper" :options="{...swiperOptions, initialSlide: swiperIndex }">
          <swiper-slide v-for="(film, i) in swiperFilms" :key="i">
            <div class="film-image" v-image="film.bannerImage" :aria-label="film.bannerDesc || 'banner'"></div>
          </swiper-slide>
          <div class="swiper-pagination" slot="pagination" v-if="swiperFilms.length > 1"></div>
        </swiper>
      </div>
      <div class="drawer" v-for="(drawer, index) in drawers" :key="index">
        <div class="drawer-title" v-show="drawer.title">{{drawer.title}}</div>
        <XScroll :posY="2 + index">
          <ul class="film-list" :class="{'col-5': true, 'col-3': false }">
            <li class="film" v-for="(film, i) in drawer.movies" :key="i" :data-pos-x="i" :data-pos-y="2 + index" @click="onFilmItemClick(film, i, drawer.title)" tabindex="0" :aria-label="film.filmRecommend">
              <div class="film-image" v-image="film.filmImgPath"></div>
              <i class="icon film-icon-corner" :style="{ 'background-image': film.extend && film.extend.iconUrl && `url(${film.extend.iconUrl})` || '' }"></i>
              <div class="film-infos">
                <div class="film-name">{{film.filmRecommend}}</div>
              </div>
            </li>
          </ul>
        </XScroll>
      </div>
    </YScroll>
  </div>
</template>

<script>
import "swiper/css/swiper.css"
import { Swiper, SwiperSlide, directive } from "vue-awesome-swiper"

import { keyCodeMap } from "@/common/posEngine"
import posEngineMixin from "@/common/posEngineMixin"
import services from "../services"

import XScroll from "@/components/XScroll"
import YScroll from "@/components/YScroll"

export default {
  name: "home",
  mixins: [posEngineMixin],
  components: {
    Swiper,
    SwiperSlide,
    XScroll,
    YScroll
  },

  directives: {
    swiper: directive
  },

  data () {
    return {
      swiperIndex: 0,
      swiperOptions: {
        autoplay: true,
        pagination: {
          el: ".swiper-pagination"
        }
      },
      swiperFilms: [],
      films: [],
      drawers: []
    }
  },

  methods: {

    onPosEngineKeyDown (data, next) {
      if (data.fromPos.y === 1) {
        if (data.keyCode === keyCodeMap.left && this.swiperFilms.length > 1) {
          this.swiper.slidePrev()
        } else if (data.keyCode === keyCodeMap.right && this.swiperFilms.length > 1) {
          this.swiper.slideNext()
        }
      }

      next()
    },

    onPosEngineBeforeMove (data, next) {
      if (data.toPos.y === 1) {
        this.swiper.autoplay.stop()
      } else {
        this.swiper.autoplay.start()
      }

      if (data.fromPos.y > 1) {
        if (data.toPos.y === data.fromPos.y) { // 水平移动
          if (data.toPos.x > data.fromPos.x) { // 向右移动
            if (data.toPos.x - this._hMoved > 4) {
              this._hMoved++
            }
          } else if (data.toPos.x < data.fromPos.x) { // 向左移动
            if (data.toPos.x - this._hMoved < 0) {
              this._hMoved--
            }
          }
        } else { // 上下移动
          if (data.toPos.y > 1 && [keyCodeMap.up, keyCodeMap.down].includes(data.keyCode)) {
            data.toPos.x = data.fromPos.x - this._hMoved
          }
          this._hMoved = 0
          if (data.toPos.y > 1 && data.fromPos.x === 0 && data.toPos.x !== 0) {
            this._hMoved = data.toPos.x - 4
          }
        }
      }
      next()
    },

    getPageData () {
      this.$loading()
      return services.getHomeInfo().then(res => {
        this.swiperFilms = res.banners
        this.films = res.movies
        this.drawers = res.drawers
      }).catch((err) => {
        console.log(err)
      }).then(() => {
        this.$loading.close()
      })
    },

    goFilmDetail (id) {
      this.$router.push({ name: "detail", params: { id } })
    },

    loadLink (url) {
      location.href = url
    },

    onBannerItemClick (banner, i) {
      this.$reporter.track("vizio_home_banner_click", { imageurl: banner.bannerImage, jumpLink: banner.jumpLink, position: i + 1 })
      this.loadLink(banner.jumpLink)
    },

    onFilmItemClick (film, i, title) {
      this.$reporter.track("vizio_home_post_click", { sku_id: film.filmSku, film_name: film.filmName, position: i + 1, post_title: title })
      this.goFilmDetail(film.filmSku)
    }
  },

  beforeMount () {
    this.getPageData()
    this._hMoved = 0
  },

  mounted () {
    // window.VIZIO
    const swiper = this.swiper = this.$refs.mySwiper.swiperInstance
    swiper.on("slideChange", () => {
      this.swiperIndex = swiper.activeIndex
    })
    this.$reporter.track("vizio_home_enter")
  }
}
</script>

<style lang="scss" scoped>
.home {
  overflow: hidden;
  padding: 0 !important;
  .film-swiper {
    overflow: visible;
    .swiper-slide {
      @include flex($jus: center);
      padding: 0 $page-margin;
    }

    .swiper-pagination-fraction,
    .swiper-pagination-custom,
    .swiper-container-horizontal > .swiper-pagination-bullets {
      // bottom: rem(-15);
    }

    .swiper-container-horizontal > .swiper-pagination-bullets .swiper-pagination-bullet {
      margin: 0 rem(3);
      width: rem(6);
      height: rem(6);
      background: rgba(255, 255, 255, 0.2);

      &.swiper-pagination-bullet-active {
        background: #fff;
      }
    }
    .film-image {
      width: 100%;
      height: rem(296);
      background: none center no-repeat;
      background-size: 100% 100%;
    }
  }
  .film-swiper-box {
    padding-top: rem(24);
    border-radius: rem(4);
    box-shadow: none;
    position: relative;
    &.pos-active:before {
      content: "";
      position: absolute;
      top: rem(24);
      bottom: 0;
      left: $page-margin;
      right: $page-margin;
      border-radius: rem(4);
      box-shadow: 0 0 0 $pos-active-size $color-active;
    }
  }

  /deep/ .y-scroll-wrap {
    height: rem(970);
    .y-scroll {
      padding-bottom: rem(40);
    }
    .y-scroll-ruler {
      top: rem(100);
      bottom: rem(150);
    }
  }

  /deep/ .x-scroll-ruler {
    margin-left: $page-margin;
    margin-right: $page-margin;
  }

  .drawer {
    padding-top: rem(36);
    &-title {
      padding: rem(24) $page-margin 0;
      @include font(38, 53);
      color: $color-dark;
    }
  }

  .film-list {
    padding: rem(24) $page-margin $pos-active-size;
    @include flex($flow: row nowrap, $jus: flex-start, $ali: flex-start);
    .film {
      flex: 0 0 auto;
      background: $bg-content;
      border-radius: rem(4);
      position: relative;
      .film-image {
        background: none center no-repeat;
        background-size: 100% 100%;
      }
      .film-icon-corner {
        position: absolute;
        left: rem(-20);
        top: rem(-20);
        width: rem(250);
        height: rem(250);
        background: none center no-repeat;
        background-size: contain;
      }
      .film-infos {
        @include flex($jus: center);
        padding: 0 rem(15);
        height: rem(80);
        @include font(24, 36);
        text-align: center;
        color: $color-dark;
        .film-name {
          @include text-line-clamp(2);
        }
      }

    }

    &.col-3 {
      .film {
        margin-left: rem(45);
        width: rem(530);
        .film-image {
          height: rem(420);
        }
        &:nth-child(1) {
          margin-left: 0;
        }
      }

    }

    &.col-5 {
      .film {
        margin-left: rem(40);
        width: rem(304);
        .film-image {
          height: rem(406);
        }
        &:nth-child(1) {
          margin-left: 0;
        }
      }

    }
  }
}
</style>
