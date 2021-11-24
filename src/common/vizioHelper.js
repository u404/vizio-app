export const inVizio = /VIZIO/.test(navigator.userAgent)

export const state = {
  inited: false,
  deviceId: "",
  AdvertiserID: null,
  IP: "",
  isCCEnabled: undefined,
  isTTSEnabled: undefined
}

export const event = {
  handlers: {},
  emit (name, data) {
    if (!event.handlers[name]) return
    event.handlers[name].forEach(h => h(data))
  },
  on (name, handler) {
    if (!event.handlers[name]) {
      event.handlers[name] = []
    }
    event.handlers[name].push(handler)
  },
  off (name, handler) {
    if (!event.handlers[name]) return
    event.handlers[name] = event.handlers[name].filter(h => h !== handler)
  },
  once (name, handler) {
    const _handler = (data) => {
      event.off(name, _handler)
      handler(data)
    }
    event.on(name, _handler)
  }
}

const init = () => {
  if (!inVizio) {
    state.deviceId = "vizio-error-deviceId"
    state.AdvertiserID = {}
    event.emit("deviceIdLoaded", state.deviceId)
    return
  }

  if (state.inited) return
  state.inited = true

  // 只有在开启tts情况下，进入app，才会朗读一次。中间切换过程中，不再朗读。防止与读取按钮时冲突。
  event.once("TTSStateChange", (enabled) => {
    if (enabled) {
      window.VIZIO.Chromevox.play("Smart Cinema USA!")
    }
  })

  document.addEventListener("VIZIO_TTS_ENABLED", function (e) {
    state.isTTSEnabled = true
    event.emit("TTSStateChange", state.isTTSEnabled)
  })

  document.addEventListener("VIZIO_TTS_DISABLED", function (e) {
    state.isTTSEnabled = false
    event.emit("TTSStateChange", state.isTTSEnabled)
  })

  document.addEventListener("VIZIO_LIBRARY_DID_LOAD", function (e) {
    console.log("VIZIO_LIBRARY_DID_LOAD")
    // Device ID
    window.VIZIO.getDeviceId(function (deviceId) {
      console.log("Unique Device Id: " + deviceId, window.performance.now())
      state.deviceId = deviceId
      event.emit("deviceIdLoaded", state.deviceId)
    })

    // AdvertiserID : { IFA, IFA_TYPE, LMT }
    window.VIZIO.setAdvertiserIDListener(function (AdvertiserID) {
      state.AdvertiserID = AdvertiserID
    })

    window.VIZIO.setClosedCaptionHandler(function (isCCEnabled) {
      state.isCCEnabled = isCCEnabled
      event.emit("CCStateChange", isCCEnabled)
    })
  }, false)

  var script = document.createElement("script")
  script.type = "text/javascript"

  script.onerror = () => {
    state.deviceId = "vizio-default-deviceId"
    state.AdvertiserID = {}
    event.emit("deviceIdLoaded", state.deviceId)
  }

  script.src = "http://localhost:12345/scfs/cl/js/vizio-companion-lib.js"
  document.head.appendChild(script)
}

export const getDeviceId = (force = true) => {
  if (!force || state.deviceId) return Promise.resolve(state.deviceId)
  return new Promise(resolve => {
    event.on("deviceIdLoaded", (e) => resolve(e))
  })
}

export const getAdvertiserID = () => {
  if (state.AdvertiserID) return Promise.resolve(state.AdvertiserID)
  return new Promise(resolve => {
    event.on("AdvertiserIDLoaded", (e) => resolve(e))
  })
}

const getUserIP = (onNewIP) => {
  var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
  var pc = new PeerConnection({
    iceServers: []
  })
  var noop = function () {}
  var localIPs = {}
  var ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g

  function iterateIP (ip) {
    if (!localIPs[ip]) onNewIP(ip)
    localIPs[ip] = true
  }

  // create a bogus data channel
  pc.createDataChannel("")

  // create offer and set local description
  pc.createOffer().then(function (sdp) {
    console.log("sdp", sdp)
    sdp.sdp.split("\n").forEach(function (line) {
      if (line.indexOf("candidate") < 0) return
      line.match(ipRegex).forEach(iterateIP)
    })

    pc.setLocalDescription(sdp, noop, noop)
  }).catch(function (reason) {
    // An error occurred, so handle the failure to connect
  })

  // listen for candidate events
  pc.onicecandidate = function (ice) {
    if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return
    ice.candidate.candidate.match(ipRegex).forEach(iterateIP)
  }
}

getUserIP((IP) => {
  state.IP = IP
})

export const getIP = () => {
  return state.IP
}

export const getCCState = () => {
  return state.isCCEnabled
}

export const onCCStateChange = (handler) => {
  event.on("CCStateChange", handler)
  if (state.isCCEnabled !== undefined) {
    handler && handler(state.isCCEnabled)
  }
}

export const offCCStateChange = (handler) => {
  event.off("CCStateChange", handler)
}

export const Chromevox = () => (window.VIZIO && window.VIZIO.Chromevox) || { play () { }, cancel () { } }

export default {
  inVizio,
  init,
  getDeviceId,
  getAdvertiserID,
  getIP,
  getCCState,
  event,
  Chromevox
}
