import posEngine, { keyCodeMap, hashHistory } from "@/common/posEngine"

import reporter from "@sc/lib-amplitude"

export default {
  props: {
    posBaseX: {
      type: Boolean,
      default: 0
    },
    posBaseY: {
      type: Boolean,
      default: 0
    }
  },
  methods: {
    // onPosEngineKeyDown (data, next) {
    //   next()
    // },
    // onPosEngineBeforeMove (data, next) {
    //   next()
    // }
    // onPosEngineAfterMove (data, next) {
    //   next()
    // }

    onPosEngineExit (data, next) {
      this.onBeforeExit && this.onBeforeExit()
      reporter.track("vizio_exit", { page: this.$route.name, lengthofstay: Math.round(window.performance.now()), exit: true })
      this.$confirm({
        title: "Exiting Smart Cinema",
        content: "Are you sure you want to exit Smart Cinema ?",
        onSure: () => {
          next()
        }
      })
    },

    onBack () {
      this.onBeforeBack && this.onBeforeBack()
      if (hashHistory.length === 1 || this.$route.name === "home") {
        reporter.track("vizio_exit", { page: this.$route.name, lengthofstay: Math.round(window.performance.now()), back: true })
        this.$confirm({
          title: "Exiting Smart Cinema",
          content: "Are you sure you want to exit Smart Cinema ?",
          onSure: () => {
            window.VIZIO.exitApplication()
          }
        })
      } else {
        // history.back()
        hashHistory.back()
      }
    },

    initPosEngine (activated = false) {
      if (!this.posEngine) {
        this.posEngine = posEngine
      }
      posEngine.bind({
        pos: this.posEnginePos,
        onKeyDown: (data, next) => {
          if (data.keyCode === keyCodeMap.back) {
            this.onBack()
            return
          }
          if (this.onPosEngineKeyDown) {
            this.onPosEngineKeyDown(data, next)
            return
          }
          next()
        },
        onBeforeMove: this.onPosEngineBeforeMove && ((...args) => this.onPosEngineBeforeMove(...args)),
        onAfterMove: (data, next) => {
          if (activated) {
            if (data.toPos.y >= this.posBaseY) {
              hashHistory.setData({ activatedPos: data.toPos })
            } else {
              hashHistory.setData({ activatedPos: undefined })
            }
          }
          if (this.onPosEngineAfterMove) {
            this.onPosEngineAfterMove(data, next)
            return
          }
          next()
        },
        onBeforeExit: this.onPosEngineExit
      })
    },

    autoSetPos () {
      const _set = () => {
        const { enterPos, activatedPos } = hashHistory.getData()
        if (activatedPos) {
          posEngine.activeElement(posEngine.findElement(activatedPos))
          return
        }
        if (enterPos) {
          posEngine.activeElement(posEngine.findElement(enterPos))
        } else if (posEngine.elementVisible(posEngine.$el)) {
          posEngine.activeElement(posEngine.$el)
        } else {
          posEngine.activeFirstVisibleElement()
        }

        hashHistory.setData({ enterPos: posEngine.pos })
      }

      this.$nextTick(_set)
    }

  },

  mounted () {
    this.initPosEngine()
    hashHistory.emitChange()
    this.autoSetPos()
  },
  activated () {
    this.initPosEngine(true)
    hashHistory.emitChange()
    this.autoSetPos()
  }
}
