<template>
  <div class="settings">
    <div class="tabs">
      <router-link class="tab pos-active-reset" v-for="(nav, i) in routes" :key="i" v-show="nav.display ? nav.display($store) : true" :to="{ name: nav.name }" replace :data-pos-x="i + posBaseX" :data-pos-y="posBaseY + 0">{{nav.title}}</router-link>
    </div>
    <div class="settings-view-box">
      <router-view class="settings-view"></router-view>
    </div>
  </div>
</template>

<script>
import { settingsRoutes } from "../../router"
export default {
  props: {
    id: String,
    posBaseX: Number,
    posBaseY: Number
  },
  data () {
    return {
      routes: settingsRoutes.filter(r => r.title)
    }
  }
}
</script>

<style lang="scss" scoped>
.settings {
  padding-left: rem(460) !important;
  .tabs {
    margin-top: rem(26);
    @include flex($jus: flex-start);
    a.tab {
      margin-right: rem(30);
      width: rem(250);
      height: rem(60);
      @include font(36, 54);
      font-weight: 400;
      background: $bg-content;
      color: $color-normal;
      @include flex($jus: center);
      border-radius: rem(4);
      &.router-link-active {
        font-weight: 500;
        color: $color-dark;
      }

      &.pos-active {
        background: $color-dark;
        font-weight: 500;
        color: $color-light;
      }
    }
  }
  .settings-view-box {

  }
  &-view {
    padding-top: rem(60);
    /deep/ &-title {
      @include font(48, 72);
      color: $color-dark;
      font-weight: bold;
      &.icon-title {
        padding-left: rem(68);
        background: none left center no-repeat;
        background-size: rem(44);
      }
    }
  }
}
</style>
