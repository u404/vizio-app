export const fullScreen = {
  enabled: false,

  enter (element) {
    fullScreen.enabled = true
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullScreen()
    }
  },

  exit () {
    if (!fullScreen.enabled) {
      return
    }
    fullScreen.enabled = false
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExiFullscreen()
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

export const AutoRun = function (fn, time) {
  let timer = null
  let then = () => {
    timer = setTimeout(runOnce, time)
  }
  let runOnce = () => {
    fn().then(() => then && then())
  }

  let cancel = () => {
    timer && clearTimeout(timer)
    timer = null
    then = null
    runOnce = null
  }

  runOnce()

  return {
    cancel
  }
}
