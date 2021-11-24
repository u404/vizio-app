<template>
  <div v-if="!mounted || !filmInfo" />
  <Detail v-else-if="!filmInfo.hasTicket" :id="id" />
  <Play v-else :id="id" />
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex"

import Detail from "./Detail"
import Play from "./NewPlay.v2"

import InfiniteLoading from "@/components/InfiniteLoading/index"
import posEngineMixin from "@/common/posEngineMixin"

export default {
  components: {
    Detail,
    Play
  },
  mixins: [posEngineMixin],
  props: {
    id: String
  },
  data () {
    return {
      cancelState: false,
      mounted: false
    }
  },
  computed: {
    ...mapState(["tempFilmSku", "tempFilmInfo"]),
    filmInfo () {
      return this.tempFilmInfo && this.tempFilmInfo.skuId === this.id ? this.tempFilmInfo : null
    }
  },

  methods: {
    ...mapMutations(["setState"]),
    ...mapActions(["loadFilmInfo"]),
    async loadData () {
      if (this.filmInfo) {
        return
      }

      InfiniteLoading.show()
      this.setState({ tempFilmSku: this.id, tempFilmInfo: null })
      await this.loadFilmInfo()
        .then(() => {
          if (this.cancelState) return
          InfiniteLoading.hide()
        }).catch(() => {
          if (this.cancelState) return
          InfiniteLoading.hide()
          this.$alert("Loading failed.")
          this.setState({ tempFilmSku: null, tempFilmInfo: null })
          history.back()
        })
    }
  },

  beforeMount () {
    this.loadData()
  },
  mounted () {
    this.mounted = true
  },
  beforeDestroy () {
    this.cancelState = true
    InfiniteLoading.showing() && InfiniteLoading.hide()
  }
}
</script>
