export const hashHistory = {
  stack: [],
  dataStack: [],
  emitChange (data = {}) {
    const hash = location.hash
    const existIndex = hashHistory.stack.indexOf(hash)
    if (existIndex < 0) {
      hashHistory.stack.push(hash)
      hashHistory.dataStack.push(data)
      console.log("history change", hashHistory.stack)
      return 1
    } else {
      const removes = hashHistory.stack.splice(existIndex + 1)
      hashHistory.dataStack.splice(existIndex + 1)
      console.log("history change", hashHistory.stack)
      return -removes.length
    }
  },

  getData () {
    const lastIndex = hashHistory.dataStack.length - 1
    return hashHistory.dataStack[lastIndex]
  },

  setData (data = {}) {
    const lastIndex = hashHistory.dataStack.length - 1
    hashHistory.dataStack[lastIndex] = { ...hashHistory.dataStack[lastIndex], ...data }
  },

  back () {
    const backIndex = hashHistory.stack.length - 2
    if (backIndex > -1) {
      location.hash = hashHistory.stack[backIndex]
      return true
    } else {
      return false
    }
  },
  go (hash) {
    location.hash = hash
  },

  get length () {
    return hashHistory.stack.length
  }
}

export const keyCodeMap = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  ok: 13,
  back: 8,
  exit: 27
}

export class PosEngine {
  constructor ($wrap = document.body) {
    this.$wrap = $wrap
    this.inited = false
    this.pos = { x: 0, y: 0 }
    this.grid = []
    this.$el = null
    this.disabled = false
  }

  _events = {}

  _hooks = {
    onKeyDown: [],
    onBeforeMove: [],
    onAfterMove: [],
    onBeforeExit: []
  }

  _onceHooks = {
    onBinded: []
  }

  _elementVisible ($el) {
    if ($el && $el.offsetParent) {
      return true
    }
  }

  _findElement ({ x, y }, $wrap) {
    const $w = $wrap || this.$wrap
    const $el = $w.querySelector(`[data-pos-x='${x}'][data-pos-y='${y}']`)
    if (this._elementVisible($el)) {
      return $el
    }
    return null
  }

  _findMaxX (y) {
    return [].reduce.call(this.$wrap.querySelectorAll(`[data-pos-y='${y}']`), (res, item) => {
      if (!this._elementVisible(item)) {
        return res
      }
      return Math.max(res, +item.dataset["posX"])
    }, 0)
  }

  _findMinX (y) {
    return [].reduce.call(this.$wrap.querySelectorAll(`[data-pos-y='${y}']`), (res, item) => {
      if (!this._elementVisible(item)) {
        return res
      }
      return Math.min(res, +item.dataset["posX"])
    }, Number.MAX_VALUE)
  }

  _activeElement ($el) {
    if ($el) {
      this.$el && this.$el.classList.remove("pos-active")
      $el.classList.add("pos-active")
      $el.focus({ preventScroll: true })
      this.$el = $el
      return true
    }
    return false
  }

  _getElementPos ($el) {
    if (!$el) return null
    return { x: +$el.dataset.posX, y: +$el.dataset.posY }
  }

  _moveTo (pos, callback = () => {}) {
    let success = false
    if (!pos) return callback(success)
    const fromPos = this.pos
    const fromEl = this.$el
    const $nextElement = this._findElement(pos)
    success = this._activeElement($nextElement)

    if (success) {
      this.pos = pos
      this._execHooks(this._hooks.onAfterMove, { fromPos, toPos: this.pos, fromEl, toEl: this.$el }, () => {})
    }
    return callback(success)
  }

  _keyHandlers = {
    [keyCodeMap.up] (keyCode) {
      let nextPos = { x: this.pos.x, y: this.pos.y - 1 }
      if (this._findElement(nextPos)) {
        this.moveTo(nextPos, keyCode)
      } else {
        nextPos.x = this._findMaxX(nextPos.y)
        if (this._findElement(nextPos)) {
          this.moveTo(nextPos, keyCode)
        }
      }
    },
    [keyCodeMap.down] (keyCode) {
      let nextPos = { x: this.pos.x, y: this.pos.y + 1 }
      if (this._findElement(nextPos)) {
        this.moveTo(nextPos, keyCode)
      } else {
        nextPos.x = this._findMaxX(nextPos.y)
        if (this._findElement(nextPos)) {
          this.moveTo(nextPos, keyCode)
        }
      }
    },
    [keyCodeMap.left] (keyCode) {
      let nextPos = { x: this.pos.x - 1, y: this.pos.y }
      if (this._findElement(nextPos)) {
        this.moveTo(nextPos, keyCode)
      } else {
        nextPos.y -= 1
        nextPos.x = this._findMaxX(nextPos.y)
        if (this._findElement(nextPos)) {
          this.moveTo(nextPos, keyCode)
        }
      }
    },
    [keyCodeMap.right] (keyCode) {
      let nextPos = { x: this.pos.x + 1, y: this.pos.y }
      if (this._findElement(nextPos)) {
        this.moveTo(nextPos, keyCode)
      } else {
        nextPos.y += 1
        nextPos.x = this._findMinX(nextPos.y)
        if (this._findElement(nextPos)) {
          this.moveTo(nextPos, keyCode)
        }
      }
    },
    [keyCodeMap.ok] (keyCode) {
      if (this.$el) {
        var event = document.createEvent("MouseEvents")
        event.initEvent("click", true, true)
        this.$el.dispatchEvent(event)
      } else {
        this.enterPos(keyCode)
      }
    },
    [keyCodeMap.back] () {
      if (history.length > 1) {
        history.back()
      } else {
        window.VIZIO.exitApplication()
      }
    }
  }

  _initEvents () {
    this._removeEvents()
    this._registEvents("keydown", (e) => {
      e.preventDefault()
      if (e.keyCode === keyCodeMap.exit) { // 退出键，优先级最高，直接退出
        this._execHooks(this._hooks.onBeforeExit, {}, () => {
          window.VIZIO.exitApplication()
        })
        return
      }
      if (this.disabled) return
      this._execHooks(this._hooks.onKeyDown, { fromPos: this.pos, keyCode: e.keyCode }, () => {
        const handler = this._keyHandlers[e.keyCode]
        handler && handler.call(this, e.keyCode)
      })
    })
  }

  _execHooks (hooksList = [], data, next) {
    if (!hooksList.length) {
      next()
      return
    }
    const hook = hooksList[0]
    const _hooksList = hooksList.slice(1)

    hook(data, () => {
      this._execHooks(_hooksList, data, next)
    })
  }

  _removeEvents () {
    Object.keys(this._events).forEach(name => {
      this._events[name].forEach(handler => {
        window.removeEventListener(name, handler)
      })
      delete this._events[name]
    })
  }

  _registEvents (name, handler) {
    if (!this._events[name]) {
      this._events[name] = []
    }
    this._events[name].push(handler)
    window.addEventListener(name, handler)
  }

  // 全局钩子，在高亮位置变化前执行，两个参数(data, next)，钩子内部必须手动调用next()
  onBeforeMove (handler) {
    this._hooks.onBeforeMove.push(handler)
  }

  onAfterMove (handler) {
    this._hooks.onAfterMove.push(handler)
  }

  onKeyDown (handler) {
    this._hooks.onKeyDown.push(handler)
  }

  onBeforeExit (handler) {
    this._hooks.onBeforeExit.push(handler)
  }

  // 重置高亮位置
  resetPos () {
    this.pos = { x: 0, y: 0 }
    this.$el && this.$el.classList.remove("pos-active")
    this.$el = null
  }

  // 高亮第一项
  enterPos (keyCode) {
    this.moveTo({ x: 0, y: 1 }, keyCode)
  }

  // 高亮指定坐标的元素
  moveTo (toPos, keyCode, callback) {
    this._execHooks(this._hooks.onBeforeMove, { fromPos: this.pos, toPos, keyCode }, () => {
      this._moveTo(toPos, callback)
    })
  }

  findElement ({ x, y }, $wrap) {
    return this._findElement({ x, y }, $wrap)
  }

  activeElement ($el) {
    if ($el) {
      this._activeElement($el)
      this.pos = this._getElementPos($el)
    } else {
      this.resetPos()
    }
  }

  registHook (name, handler) {
    this._hooks[name].push(handler)
  }

  removeHook (name, handler) {
    if (!this._hooks[name]) return
    if (!handler) {
      this._hooks[name] = []
    } else {
      this._hooks[name] = this._hooks[name].filter(h => h !== handler)
    }
  }

  clearHooks () {
    Object.keys(this._hooks).forEach(name => {
      this._hooks[name] = []
    })
  }

  // 重置，会清空所有钩子
  reset () {
    this.resetPos()
    this.clearHooks()
  }

  // 初始化，注册事件等，全局执行一次即可。##因为是全局单例，正在考虑是否直接默认初始化##
  init () {
    this.reset()
    this._initEvents()
    this.moveTo({ x: 0, y: 0 })
  }

  bind ({ onBeforeMove, onKeyDown, onAfterMove, onBeforeExit, pos } = {}) {
    if (!this.inited) {
      this.init()
      this.inited = true
    } else {
      this.clearHooks()
    }
    onBeforeMove && this._hooks.onBeforeMove.push(onBeforeMove)
    onKeyDown && this._hooks.onKeyDown.push(onKeyDown)
    onAfterMove && this._hooks.onAfterMove.push(onAfterMove)
    onBeforeExit && this._hooks.onBeforeExit.push(onBeforeExit)
    pos && this.moveTo(pos)
    this._execHooks(this._onceHooks.onBinded, {}, () => {})
    this._onceHooks.onBinded = []
  }

  onBinded (handler) {
    const _handler = (data, next) => {
      handler(data)
      next()
    }
    this._onceHooks.onBinded.push(_handler)
  }

  destroy () {
    this._removeEvents()
    this.reset()
    this.$el = null
    this.$wrap = null
  }

  enable () {
    this.disabled = false
    this.$el && this.$el.focus({ preventScroll: true })
  }

  disable () {
    this.disabled = true
  }

  elementVisible ($el) {
    return this._elementVisible($el)
  }

  findFirstElement ($wrap) {
    $wrap = $wrap || this.$wrap
    return $wrap.querySelector(`[data-pos-x][data-pos-y]`)
  }

  findFirstVisibleElement ($wrap) {
    $wrap = $wrap || this.$wrap
    return Array.prototype.find.call($wrap.querySelectorAll(`[data-pos-x][data-pos-y]`), (el) => this._elementVisible(el))
  }

  activeFirstElement ($wrap) {
    this.activeElement(this.findFirstElement($wrap))
  }

  activeFirstVisibleElement ($wrap) {
    this.activeElement(this.findFirstVisibleElement($wrap))
  }
}

// 项目主引擎
const posEngine = new PosEngine()

export default posEngine
