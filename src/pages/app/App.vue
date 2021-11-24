<template>
  <Page></Page>
</template>

<script>
import { mapMutations } from "vuex"
import Page from "./layouts/Page"

import { getDeviceId, event } from "@/common/vizioHelper"

export default {
  components: {
    Page
  },
  data () {
    return {
    }
  },
  methods: {
    ...mapMutations(["setState"])
  },

  beforeMount () {
    getDeviceId().then(deviceId => this.$reporter.init(deviceId))
    event.on("TTSStateChange", (enabled) => {
      this.setState({ isTTSEnabled: enabled })
    })
  },
  mounted () {
    window.addEventListener("keypress", e => {
      console.log("按键：", e.keyCode)
    })
  }
}
</script>
