<template>
  <div class="h5-confirm" tabindex="0" :aria-label="`Dialog. ${content} Confirm Button`">
    <transition name="h5-fade" appear>
      <div class="h5-confirm-mask" v-show="visible"></div>
    </transition>
    <transition name="h5-slideUp" appear>
      <div class="h5-confirm-body" v-show="visible">
        <div class="h5-confirm-title">{{title}}</div>
        <div class="h5-confirm-content">{{content}}</div>
        <div class="h5-confirm-btns">
          <div class="h5-confirm-btn" @click="sure" :data-pos-x="0" :data-pos-y="0" tabindex="0" role="button" aria-label="Confirm">Confirm</div>
          <div class="h5-confirm-btn" @click="cancel" :data-pos-x="1" :data-pos-y="0" tabindex="0" role="button" aria-label="Cancel">Cancel</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import posEngine, { PosEngine, keyCodeMap } from "@/common/posEngine"
import { Chromevox } from "@/common/vizioHelper"

export default {
  props: {
  },

  data () {
    return {
      visible: false,
      title: "",
      content: ""
    }
  },

  methods: {

    show ({ title, content, onSure = (close) => { close() }, onCancel = (close) => { close() } }) {
      this.title = title
      this.content = content
      this.visible = true
      this.onSure = onSure
      this.onCancel = onCancel

      this.$nextTick(() => {
        if (!this.posEngine) {
          this.posEngine = new PosEngine(this.$el)
        }
        posEngine.disable()
        this.posEngine.bind({
          pos: { x: 0, y: 0 },
          onKeyDown: ({ keyCode }, next) => {
            if (keyCode === keyCodeMap.back) {
              this.onCancel(() => this.close())
            } else {
              next()
            }
          },
          onBeforeExit: () => {
          }
        })
        this.posEngine.enable()
        this.$el.focus()
      })
    },
    close () {
      this.visible = false
      posEngine.enable()
      this.posEngine.destroy()
      this.posEngine = null
      this.$emit("close")
    },

    sure () {
      this.onSure(this.close.bind(this))
    },
    cancel () {
      this.onCancel(this.close.bind(this))
    }
  }

}
</script>

<style lang="scss" scoped>
.h5-confirm {
  &-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }
  &-body {
    position: fixed;
    z-index: 1001;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transform-origin: left top;
    background: rgba(85, 85, 80, 0.95);
    border-radius: rem(12);
    width: rem(1160);
    padding: rem(96) $page-margin rem(96);
  }

  &-title {
    @include font(48, 72);
    color: $color-dark;
    font-weight: bold;
    text-align: center;
  }
  &-content {
    margin-top: rem(96);
    @include font(36, 54);
    color: $color-dark;
    font-weight: 400;
    text-align: center;
  }
  &-btns {
    margin-top: rem(130);
    @include flex($jus: center);
  }
  &-btn {
    width: rem(360);
    height: rem(88);
    background: rgba(110,110,110,1);
    border-radius: rem(4);
    @include flex($jus: center);
    @include font(36, 54);
    color: $color-dark;
    font-weight: 500;
    &:nth-child(n + 2) {
      margin-left: rem(30);
    }
    &.pos-active {
      border: 1px solid rgba(151,151,151,1);
      box-shadow: none;
      background: $color-dark;
      color: $color-light;
    }
  }
}
</style>
