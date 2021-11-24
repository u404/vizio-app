<template>
  <div class="nav-layout">
    <div class="nav-layout-header">
      <Nav></Nav>
      <div class="logo"></div>
    </div>

    <div class="nav-layout-body">
      <!-- <transition :name="transitionName"> -->
        <keep-alive include="home">
          <router-view class="layout-view"></router-view>
        </keep-alive>
      <!-- </transition> -->
    </div>
  </div>
</template>

<script>
import { navRoutes } from "../router"
import Nav from "../components/Nav"
export default {
  name: "nav-layout",
  components: {
    Nav
  },
  props: {
    error: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      transitionName: ""
    }
  },
  watch: {
    "$route" (to, from) {
      const toIndex = navRoutes.findIndex(o => to.matched.find(r => r.name === o.name))
      const fromIndex = navRoutes.findIndex(o => from.matched.find(r => r.name === o.name))
      if (fromIndex === -1) return

      if (toIndex > fromIndex) {
        this.transitionName = "sleft"
      } else {
        this.transitionName = "sright"
      }
    }
  },

  mounted () {
    console.log("mounted navLayout")
  }
}
</script>

<style lang="scss" scoped>
.nav-layout {
  min-height: 100%;
  margin: 0 auto;
  padding: 0 0 !important;
  position: relative;
  @include font12;
  overflow: hidden;

  &-header {
    padding: rem(50) $page-margin 0;
    @include flex;
    .logo {
      width: rem(411);
      height: rem(51);
      background: url(https://g.smartcinemausa.com/images/6d7b83c44be342619de8be84660376c5-822-110.png) center no-repeat;
      background-size: contain;
    }
  }

  &-body {
    position: relative;

    .layout-view {
      padding: rem(24) $page-margin 0;
    }

    .sleft-enter-active,
    .sleft-leave-active,
    .sright-enter-active,
    .sright-leave-active {
      transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
      position: absolute;
      width: 100%;
    }

    .sleft-enter,
    .sright-leave-to {
      transform: translateX(100%);
    }
    .sleft-leave-to,
    .sright-enter {
      transform: translateX(-100%);
    }
  }

}
</style>
