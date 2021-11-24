<template>
  <div class="x-scroll-wrap">
    <div class="x-scroll-ruler" ref="xScrollRuler"></div>
    <div class="x-scroll" ref="xScroll">
      <div class="x-scroll-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import anime from "animejs"
import posEngine from "@/common/posEngine"

export default {
  props: {
    posY: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {

    }
  },
  methods: {

    xScrollToEl (toEl, duration) {
      const rulerRect = this.$refs.xScrollRuler.getBoundingClientRect()

      const toRect = toEl.getBoundingClientRect()

      if (toRect.left < rulerRect.left) {
        this.xScrollTo(this.$refs.xScroll.scrollLeft + toRect.left - rulerRect.left, duration)
      } else if (toRect.right > rulerRect.right) {
        this.xScrollTo(this.$refs.xScroll.scrollLeft + toRect.right - rulerRect.right, duration)
      }
    },

    xScrollTo (left, duration = 300) {
      this.xScrollLeft = left
      const xScroll = this.$refs.xScroll
      anime.remove(xScroll)
      anime({
        targets: xScroll,
        scrollLeft: [xScroll.scrollLeft, left],
        easing: "easeOutQuad",
        duration
      })
    },

    bindPosEngineEvent () {
      if (this._eventBinded) return
      this._eventBinded = true
      this._eventHandler = ({ fromPos, toPos, fromEl, toEl }, next) => {
        if (toPos.y === this.posY) {
          this.xScrollToEl(toEl, 200)
        } else if (fromPos.y === this.posY) {
          // this.$refs.xScroll.scrollLeft = 0
          this.xScrollTo(0)
        }
        next()
      }
      this.$nextTick(() => {
        posEngine.onAfterMove(this._eventHandler)
      })
    }
  },

  mounted () {
    this.bindPosEngineEvent()
  },

  activated () {
    this.xScrollLeft && this.xScrollTo(this.xScrollLeft, 0)
    this.bindPosEngineEvent()
  },

  deactivated () {
    this._eventBinded = false
    posEngine.removeHook("onBeforeMove", this._eventHandler)
  },

  beforeDestroy () {
    anime.remove(this.$refs.xScroll)
  }

}
</script>

<style lang="scss">
  .x-scroll {
    overflow: auto;
    &-wrap {

    }
    &-ruler {
    }
    &-content {
      float: left;
    }
  }
</style>
