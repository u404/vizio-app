<template>
  <div class="nav" role="menubar">
    <router-link class="menu pos-active-reset" v-for="(nav, i) in navRoutes" v-show="nav.display ? nav.display($store) : true" :key="i" :to="{ path: nav.path}" :data-pos-x="i" :data-pos-y="0" role="menuitem" :aria-label="nav.title">{{nav.title}}</router-link>
  </div>
</template>

<script>
import { navRoutes } from "../router"
export default {
  data () {
    return {
      navRoutes: navRoutes.filter(r => r.title)
    }
  }
}
</script>

<style lang="scss" scoped>
.nav {
  @include flex($jus: flex-start);
  .menu-list {

  }
  a.menu {
    margin-left: rem(110);
    @include font(40, 60);
    font-weight: 400;
    color: inherit;
    &:first-child {
      margin-left: 0;
    }

    &.router-link-active {
      font-weight: 500;
      color: $color-dark;
    }

    &.pos-active {
      padding: 0 rem(28);
      background: $color-dark;
      font-weight: 500;
      color: $color-light;
      border-radius: rem(4);
    }
  }
}
</style>
