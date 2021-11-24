<template>
  <div class="infinite-loading" :class="{ 'infinite-loading--transparent': transparent }" v-show="visible">
    <i class="logo"></i>
  </div>
</template>

<script>

export default {
  props: {
  },

  data () {
    return {
      visible: false,
      transparent: false
    }
  },

  methods: {

    showing () {
      return this.visible
    },

    show (transparent = true) {
      this.visible = true
      this.transparent = transparent
    },

    hide () {
      this.visible = false
    }
  }

}
</script>

<style lang="scss" scoped>
@keyframes blink {
  from {
    transform: translate(0) rotate(25deg);
  }
  to {
    transform: translate(rem(1800)) rotate(25deg);
  }
}
.infinite-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-body;
  @include flex(column, flex-end, flex-end);
  padding: rem(156) rem(104);
  z-index: 1001;

  &--transparent {
    background: none;
  }

  .logo {
    display: block;
    width: rem(170);
    height: rem(170);
    background: url(https://g.smartcinemausa.com/images/8c985d11dcc247878f342429177c1e8e-340-340.gif) center no-repeat;
    background-size: contain;
  }
}
</style>
