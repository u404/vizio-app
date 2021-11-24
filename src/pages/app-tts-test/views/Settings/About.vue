<template>
  <div class="about">
    <div class="settings-view-title icon-title">About</div>
    <div class="settings-view-content" ref="content" tabindex="0">
      Smart Cinema USA is one of the most innovative virtual cinemas which dramatically increases the day-n-date "theatrical" releases of Asian films in North America. It is accessible from cross-platform devices including iOS/Android mobile phones, smart TVs. With one ticket buys a one-time viewing, Smart Cinema USA is advocating and boosting the box office driven business model. This cinema is supported by the latest 5G, AI, VR technologies, offering audiences a unique movie watching experience. Smart Cinema USA is also the first-choice online panorama and event partner of many international and local film festivals.
    </div>
  </div>
</template>

<script>
import posEngineMixin from "@/common/posEngineMixin"
export default {
  mixins: [posEngineMixin],
  mounted () {
    this.$refs.content.focus()
  }
}
</script>

<style lang="scss" scoped>
.about {
  .settings-view-title {
    @include font(48, 72);
    color: $color-dark;
    font-weight: bold;
    &.icon-title {
      padding-left: rem(68);
      background: none left center no-repeat;
      background-size: rem(44);
    }
    &.icon-title {
      background-image: url(https://g.smartcinemausa.com/images/f36589487afe4cf4b27e7acf58a26ca6-88-88.png);
    }
  }
  .settings-view-content {
    padding: rem(30) 0;
    @include font(30, 60);
  }
}
</style>
