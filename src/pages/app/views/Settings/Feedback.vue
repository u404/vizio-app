<template>
  <div class="feedback">
    <div class="settings-view-title icon-title">Feedback</div>
    <div class="settings-view-content">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar sic tempor. Sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus pronin sapien nunc accuan eget.
    </div>
  </div>
</template>

<script>
import posEngineMixin from "@/common/posEngineMixin"
export default {
  mixins: [posEngineMixin]
}
</script>

<style lang="scss" scoped>
.feedback {
  .icon-title {
    background-image: url(https://g.smartcinemausa.com/images/37b6f3ae78544722851bff373af2b49b-88-80.png);
  }
  .settings-view-content {
    padding: rem(30) 0;
    @include font(30, 60);
  }
}
</style>
