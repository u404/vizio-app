<template>
  <div class="loading-mask" v-if="visible">
    <i class="logo"></i>
    <div class="loading-progress">
      <div class="loading-progress-bar" :style="{'animation-duration': `${duration}ms`}" ref="progressBar"></div>
    </div>
    <div class="tips">
      Theatrical and New Films<br />
      Being Shown in Cinemas
    </div>
  </div>
</template>

<script>
export default {
  props: {
    duration: {
      type: Number,
      default: 1000
    },
    logData: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      visible: true
    }
  },
  methods: {
    init () {
      if (this._inited) return
      this._inited = true
      this.$nextTick(() => {
        this.$refs.progressBar.addEventListener("animationend", () => {
          this.visible = false
        })
        this.$refs.progressBar.addEventListener("webkitAnimationEnd", () => {
          this.visible = false
        })
      })
      this.$reporter.track("vizio_loading", this.logData)
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-body;
  @include flex(column, center, center);
  z-index: 10000;
  .logo {
    display: block;
    width: rem(646);
    height: rem(267);
    background: url(https://g.smartcinemausa.com/images/f026f68850944ee2ba9ec1054fb313cf-1292-534.png) center no-repeat;
    background-size: contain;
    margin-bottom: rem(145);
  }
  .loading-progress {
    width: rem(800);
    height: rem(16);
    border-radius: rem(16);
    background: $color-light;
    overflow: hidden;
    &-bar {
      display: block;
      width: 0;
      height: 100%;
      border-radius: rem(16);
      background: $color-dark;
      animation: progressing 0.8s ease 0.3s forwards;
    }
  }
  .tips {
    margin-top: rem(60);
    @include font(30, 60);
    color: $color-dark;
  }
}

</style>
