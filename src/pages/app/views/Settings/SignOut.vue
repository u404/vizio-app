<template>
  <div class="signout">
    <div class="settings-view-title icon-title">Sign out</div>
    <div class="settings-view-content">
      <div class="tips">Are you sure, you want to exit Smart Cinema ?</div>
      <div class="btn confirm-btn" :data-pos-x="posBaseX + 0" :data-pos-y="posBaseY + 0">Confirm</div>
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
.signout {
  .icon-title {
    background-image: url(https://g.smartcinemausa.com/images/3188e73f749d4bd9b07a6606e763a549-92-90.png);
  }
  .settings-view-content {
    padding: rem(30) 0;
    @include font(30, 60);

    .tips {
      @include font(30, 60);
      color: $color-dark;
    }
    .btn {
      margin-top: rem(60);
      @include button;
      width: rem(300);
      height: rem(88);
      @include font(36, 54);
    }
  }
}
</style>
