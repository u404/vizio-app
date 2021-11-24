<template>
  <div class="exception">
    <div class="title">{{error.title}}</div>
    <div class="content">{{error.content}}</div>
    <div class="btn-group">
      <div class="btn exit-btn" data-pos-x="0" :data-pos-y="posBaseY + 0">Exit</div>
      <div class="btn retry-btn" data-pos-x="1" :data-pos-y="posBaseY + 0">Retry</div>
    </div>
  </div>
</template>

<script>
import posEngineMixin from "@/common/posEngineMixin"
export default {
  mixins: [posEngineMixin],
  props: {
    source: String
  },
  data () {
    return {
      error: {
        title: "Unavailable Location",
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo."
      }
    }
  },
  computed: {
    src () {
      return decodeURIComponent(this.source)
    }
  },
  mounted () {
    this.$nextTick(() => {
      const handler = () => {
        this.$nextTick(() => {
          this.posEngine.moveTo({ x: 0, y: 0 })
        })
        this.$el.addEventListener("transitionend", handler)
      }
      this.$el.addEventListener("transitionend", handler)
    })
  }

}
</script>

<style lang="scss" scoped>
.exception {
  padding-top: rem(207) !important;
  color: $color-dark;
  .title {
    @include font(48, 72);
    font-weight: 500;
  }
  .content {
    margin-top: rem(48);
    height: rem(320);
    @include font(36, 64);
  }
  .btn-group {
    @include flex($jus: flex-start);
    margin-top: rem(48);
    .btn {
      @include button;
    }
  }
}
</style>
