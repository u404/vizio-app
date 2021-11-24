<template>
  <div class="y-scroll-wrap">
    <div class="y-scroll-ruler" ref="scrollRuler"></div>
    <div class="y-scroll" ref="scroll">
      <div class="y-scroll-content">
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

    yScrollToEl (toEl, duration) {
      const rulerRect = this.$refs.scrollRuler.getBoundingClientRect()

      const toRect = toEl.getBoundingClientRect()

      if (toRect.top < rulerRect.top) {
        this.yScrollTo(this.$refs.scroll.scrollTop + toRect.top - rulerRect.top, 200)
      } else if (toRect.bottom > rulerRect.bottom) {
        this.yScrollTo(this.$refs.scroll.scrollTop + toRect.bottom - rulerRect.bottom, 200)
      }
    },

    yScrollTo (top, duration = 300) {
      this.yScrollTop = top
      const scroll = this.$refs.scroll
      anime.remove(scroll)
      anime({
        targets: scroll,
        scrollTop: [scroll.scrollTop, top],
        easing: "easeOutQuad",
        duration
      })
    },

    bindPosEngineEvent () {
      if (this._eventBinded) return
      this._eventBinded = true
      this._eventHandler = ({ fromPos, toPos, fromEl, toEl }, next) => {
        if (toPos.y >= 2) {
          this.yScrollToEl(toEl)
        } else {
          this.yScrollTo(0)
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
    this.yScrollTop && this.yScrollTo(this.yScrollTop, 0)
    this.bindPosEngineEvent()
  },

  deactivated () {
    this._eventBinded = false
    posEngine.removeHook("onBeforeMove", this._eventHandler)
  },

  beforeDestroy () {
    anime.remove(this.$refs.scroll)
  }

}
</script>

<style lang="scss">
.y-scroll {
  height: 100%;
  overflow-x: visible;
  overflow-y: auto;
  &-wrap {
    position: relative;
  }
  &-ruler {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
  }
  &-content {

  }
}
</style>
