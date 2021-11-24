<template>
  <div class="record">
    <div class="settings-view-title icon-title">History</div>
    <YScroll class="settings-view-content">
      <ul class="film-record-list">
        <li class="film-record" :class="{'record-status-done': film.ticketStatus === 2}" v-for="(film, i) in films" :key="film.skuId" :data-pos-x="i%3 + posBaseX" :data-pos-y="posBaseY + Math.floor(i/3)" @click="goPlay(film)" tabindex="0" :aria-label="film.filmName">
          <div class="film-image" v-image="film.filmPosterUrl">
            <div class="record-time">{{getVideoTimeStr(film.playProgress > film.filmLength ? film.filmLength : film.playProgress) + '/' + getVideoTimeStr(film.filmLength)}}</div>
          </div>
          <div class="film-name">{{film.filmName}}</div>
        </li>
      </ul>
    </YScroll>
  </div>
</template>

<script>

import posEngineMixin from "@/common/posEngineMixin"
import { keyCodeMap, hashHistory } from "@/common/posEngine"
import services from "../../services"

import YScroll from "@/components/YScroll"

import PlayerHelper from "../../components/PlayerHelper"

export default {
  mixins: [posEngineMixin],
  components: {
    YScroll
  },
  data () {
    return {

      films: []
    }
  },
  methods: {
    getVideoTimeStr (seconds) {
      let tmp = seconds
      const h = Math.floor(tmp / 3600)
      tmp = tmp % 3600
      const m = Math.floor(tmp / 60)
      const s = tmp % 60
      return [h > 0 && h.toZeroFixed(), m.toZeroFixed(), s.toZeroFixed()].filter(Boolean).join(":")
    },

    getPageData () {
      this.$loading()
      return services.getTicketList().then(res => {
        // test
        // res = [
        //   { "ticketNo": "200716021157000001", "skuId": 282, "filmName": "北美测试全10分钟", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000002", "skuId": 175, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000003", "skuId": 176, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000004", "skuId": 177, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000005", "skuId": 178, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000006", "skuId": 179, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 },
        //   { "ticketNo": "200715023830000007", "skuId": 170, "filmName": "国外鸿空测试", "filmPosterUrl": "https://g.smartcinemausa.com/images/7008fb6615004d4c949f0812fb4a9d63-691-294.png", "filmLength": 7200, "playProgress": 0, "ticketStatus": 1 }
        // ]
        this.films = res
      }).catch(() => {
        this.$alert("Loading failed. Please back and retry.")
      }).then(() => {
        this.$loading.close()
      })
    },

    goPlay (film) {
      if (this.loading) return
      if (film.ticketStatus === 2) return
      this.$router.push({ name: "play", params: { id: film.skuId } })
    },

    onPosEngineKeyDown ({ fromPos, keyCode }, next) {
      if (fromPos.y === 0 && keyCode === keyCodeMap.down) {
        this.posEngine.activeFirstElement(this.$el)
        return
      } else if (fromPos.y === 1 && keyCode === keyCodeMap.up) {
        const { enterPos } = hashHistory.getData()
        this.posEngine.activeElement(this.posEngine.findElement(enterPos))
        return
      }
      next()
    }
  },

  mounted () {
    this.getPageData()
    PlayerHelper.adPlayer.preload()
  },
  activated () {
    PlayerHelper.adPlayer.preload()
  },
  beforeDestroy () {
    PlayerHelper.clearBaseData() // 由于广告加载是提前的，埋点事件会加入事件队列，直到进入播放页才上报。如果用户不进入播放页，则需要清理事件队列
  }
}
</script>

<style lang="scss" scoped>
.record {
  padding-top: rem(60);
  .settings-view-title {
    @include font(48, 72);
    color: $color-dark;
    font-weight: bold;
    &.icon-title {
      padding-left: rem(68);
      background: none left center no-repeat;
      background-size: rem(44);
    }
    &.icon-title {
      background-image: url(https://g.smartcinemausa.com/images/c2084c3eab544f29ad05658470506692-88-88.png);
    }
  }

  .settings-view-content {
    height: rem(750);
    margin-left: -$page-margin;

    /deep/ .y-scroll-content {
      padding-left: $page-margin;
    }
  }

  .film-record-list {
    padding-top: rem(22);
    @include flex(row wrap, flex-start);
    .film-record {
      margin-right: rem(40);
      margin-bottom: rem(24);
      border-top: $pos-active-size solid transparent;
      border-bottom: $pos-active-size solid transparent;
      .film-image {
        width: rem(390);
        height: rem(219);
        border-radius: rem(5);
        background: none center no-repeat;
        background-size: cover;
        position: relative;
        &:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
        }
        &:after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: rem(-35);
          margin-left: rem(-35);
          width: rem(70);
          height: rem(70);
          background: url(https://g.smartcinemausa.com/images/a2557d3335a04bf4ac860561fdd08ef7-140-140.png) center no-repeat;
          background-size: contain;
        }

        .record-time {
          position: absolute;
          right: rem(14);
          bottom: rem(14);
          @include font(20, 30);
          color: $color-dark;
        }
      }
      &.record-status-done {
        .film-image {
          &:after {
            left: 0;
            margin-left: 0;
            width: 100%;
            margin-top: rem(-25);
            background: none;
            content: "- FINISHED -";
            text-align: center;
            white-space: nowrap;
            @include font(30, 45);
            color: $color-dark;
          }
          .record-time {
            display: none;
          }
        }
      }
      .film-name {
        margin-top: rem(20);
        @include font(24, 36);
        @include text-overflow;
        font-weight: 500;
        color: $color-dark;
      }
      &.pos-active {
        box-shadow: none;
        .film-image {
          box-shadow: 0 0 0 $pos-active-size $color-active;
        }
      }
    }
  }
}
</style>
