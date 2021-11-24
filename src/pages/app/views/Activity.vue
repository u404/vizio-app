<template>
  <div class="activity" :class="{ loading }">
    <div class="activity-title">{{drawer.title}}</div>
    <XScroll :posY="0">
      <ul class="film-list" :class="{'col-5': true, 'col-3': false }">
        <li class="film" v-for="(film, i) in drawer.movies" :key="i" :data-pos-x="i" :data-pos-y="0" @click="onFilmItemClick(film, i, drawer.title)" tabindex="0" :aria-label="film.filmRecommend">
          <div class="film-image" v-image="film.filmImgPath"></div>
          <i class="icon film-icon-corner" :style="{ 'background-image': film.extend && film.extend.iconUrl && `url(${film.extend.iconUrl})` || '' }"></i>
          <div class="film-infos">
            <div class="film-name">{{film.filmRecommend}}</div>
          </div>
        </li>
      </ul>
    </XScroll>
    <div class="activity-info" v-show="price && !buyStatus">
      <div class="price">$ {{price}}</div>
      <div class="btn" data-pos-x="0" data-pos-y="1" @click="goBuy">BUNDLE & SAVE</div>
    </div>
  </div>
</template>

<script>
import "swiper/css/swiper.css"

import { mapMutations } from "vuex"

import { keyCodeMap } from "@/common/posEngine"
import posEngineMixin from "@/common/posEngineMixin"
import services from "../services"

import XScroll from "@/components/XScroll"

export default {
  name: "activity",
  mixins: [posEngineMixin],
  components: {
    XScroll
  },
  props: {
    id: String
  },

  data () {
    return {
      loading: true,
      drawer: {},
      price: 0,
      buyStatus: 0,
      skuId: "",
      skuName: ""
    }
  },

  methods: {
    ...mapMutations(["setState"]),
    onPosEngineBeforeMove (data, next) {
      if (data.fromPos.y === 1 && data.keyCode === keyCodeMap.up) {
        data.toPos.x = this.drawer.movies.length > 2 ? 2 : this.drawer.movies.length - 1
      }

      next()
    },

    getPageData () {
      this.$loading()
      return services.getActivityInfo(this.id).then(res => {
        if (res.drawers && res.drawers[0]) {
          this.drawer = res.drawers[0]
          this.price = res.packPrice
          this.buyStatus = res.packBuyStatus
          this.skuId = res.packSkuId
          this.skuName = res.packSkuName
          this.setState({ tempFilmInfo: { actName: this.drawer.title, filmName: res.packSkuName } })
          this.report("vizio_activity_page")
        }

        this.$nextTick(() => {
          this.posEngine.moveTo({ x: 0, y: 0 })
        })
      }).catch((err) => {
        console.log(err)
      }).then(() => {
        this.loading = false
        this.$loading.close()
      })
    },

    goFilmDetail (id) {
      this.$router.push({ name: "movie", params: { id } })
      this.report("vizio_activity_page_post_click", { buyStatus: this.buyStatus ? "是" : "否" })
    },

    loadLink (url) {
      location.href = url
    },

    onFilmItemClick (film, i, title) {
      this.goFilmDetail(film.filmSku)
    },

    goBuy () {
      this.$router.push({ name: "activity-buy", params: { id: this.skuId, actId: this.id } })
      this.report("vizio_activity_page_buy")
    },

    report (name, data) {
      this.$reporter.track(name, { activity_name: this.drawer.title, sku_id: this.skuId, film_name: this.skuName, ...data })
    }
  },

  beforeMount () {
    this.getPageData()
  },

  mounted () {
  }
}
</script>

<style lang="scss" scoped>
.activity {
  overflow: hidden;
  padding: 0 !important;
  position: relative;

  /deep/ .x-scroll-ruler {
    margin-left: $page-margin;
    margin-right: $page-margin;
  }
  &-title {
    padding: rem(100) $page-margin rem(28);
    @include font(48, 48);
    color: $color-dark;
    position: relative;
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: $page-margin;
      right: $page-margin;
      height: rem(4);

      background: linear-gradient(45deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.62) 47%, rgba(255, 255, 255, 0) 100%);
      opacity: 0.45;
    }
  }

  .film-list {
    padding: rem(60) $page-margin $pos-active-size;
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

  &-info {
    position: absolute;
    left: 50%;
    bottom: rem(70);
    transform: translateX(-50%);

    .price {
      text-align: center;
      font-weight: 500;
      @include font(46, 65);
      color: #ff4062;
    }

    .btn {
      @include button;
      margin-top: rem(32);
      margin-right: 0;
    }
  }

  &.loading {
    .activity-title::before {
      content: "";
        display: inline-block;
        width: rem(500);
        height: 1em;
        background: $color-text-loading;
    }
  }
}
</style>
