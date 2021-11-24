<template>
  <div class="page">
    <ErrorMask v-if="$store.state.error"></ErrorMask>
    <template v-else>
      <LoadingMask :duration="1000" :logData="queryData"></LoadingMask>
      <!-- <transition :name="transitionName"> -->
      <keep-alive include="nav-layout,home">
        <router-view class="page-view"></router-view>
      </keep-alive>
      <!-- </transition> -->
    </template>
  </div>
</template>

<script>
import { mapState } from "vuex"
import { routes } from "../router"
import ErrorMask from "@/components/ErrorMask"
import LoadingMask from "@/components/LoadingMask"

export default {
  components: {
    ErrorMask,
    LoadingMask
  },
  data () {
    return {
      transitionName: ""
    }
  },
  computed: {
    ...mapState(["queryData"])
  },
  watch: {
    "$route" (to, from) {
      const toIndex = routes.findIndex(o => o.name === to.matched[0].name)
      const fromIndex = routes.findIndex(o => from.matched.length && o.name === from.matched[0].name)

      if (fromIndex === -1) return

      if (toIndex > fromIndex) {
        this.transitionName = "sleft"
      } else {
        this.transitionName = "sright"
      }
    }
  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100%;
  margin: 0 auto;
  position: relative;
  @include flex(column, flex-start, stretch);
  @include font12;
  overflow: hidden;
  .page-view {
    flex: 1 0 auto;
    position: relative;
    width: 100%;
    min-height: 100%;
    padding: 0 $page-margin;
  }

  .sleft-enter-active,
  .sleft-leave-active,
  .sright-enter-active,
  .sright-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
    position: absolute;
    top: 0;
    left: 0;
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
</style>
