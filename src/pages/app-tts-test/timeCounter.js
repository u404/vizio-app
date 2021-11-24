const id = Math.ceil(Math.random() * 10000)
const device = /VIZIO/.test(navigator.userAgent) ? `[Vizio-${id}]` : `[Other-${id}]`

const timeCounter = {
  lastData: {
    name: "默认",
    time: window.performance.now()
  },
  report (name) {
    // 禁用上报埋点
    // const data = { name, time: window.performance.now() }
    // data.subTime = data.time - timeCounter.lastData.time
    // timeCounter.lastData = data

    // fetch("https://api-test.smartcinemausa.com/vizio/getTicketNo", {
    //   method: "POST",
    //   body: JSON.stringify({ logInfo: `${device}${data.name}————页面时间：${data.time}, 距离上一个记录时间差：${data.subTime}` }),
    //   headers: {
    //     "content-type": "application/json"
    //   }
    // })
  }
}

timeCounter.report("业务脚本初始化")

export default timeCounter
