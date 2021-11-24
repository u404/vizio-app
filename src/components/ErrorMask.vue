<template>
  <div class="error-mask">
    <i class="logo"></i>
    <div class="title">{{error && error.title}}</div>
    <div class="content" v-html="error && error.content"></div>
  </div>
</template>

<script>
import posEngineMixin from "@/common/posEngineMixin"

const errorMap = {
  "001": {
    title: "Smart Cinema Not Available",
    content: "Smart Cinema is not available in your region.<br />To learn more, please visit: https://smartcinemausa.com"
  }
}

export default {
  mixins: [posEngineMixin],

  data () {
    return {

    }
  },
  computed: {
    error () {
      return errorMap[this.$store.state.error]
    }
  }
}
</script>

<style lang="scss" scoped>
.error-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-body;
  @include flex(column, center, center);
  text-align: center;
  z-index: 999;
  .logo {
    display: block;
    width: rem(130);
    height: rem(130);
    background: url(https://g.smartcinemausa.com/images/6ed9c8ccffe340d283bd5bcfde51b391-260-260.png) center no-repeat;
    background-size: contain;
  }
  .title {
    width: rem(1160);
    margin-top: rem(60);
    @include font(48, 72);
    font-weight: bold;
    color: $color-dark;
  }
  .content {
    width: rem(1160);
    margin-top: rem(40);
    @include font(30, 60);
    font-weight: 400;
    color: $color-dark2;
  }
}

</style>
