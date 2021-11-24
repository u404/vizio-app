<template>
  <ul class="progress-stars">
    <li class="star" v-for="i in total" :key="i">
      <i class="background"></i>
      <i class="fill" :style="{ width: `${getFillPercent(i)}%` }"></i>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    total: {
      type: Number,
      default: 5
    },
    points: {
      type: Number,
      default: 3
    }
  },

  methods: {
    getFillPercent (i) {
      const subValue = this.points - i
      if (subValue >= 0) return 100
      if (subValue < -1) return 0
      return (this.points + 1 - i) * 100 % 100
    }
  }
}
</script>

<style lang="scss" scoped>
.progress-stars {
  @include flex($jus: flex-start);
  .star {
    flex: 0 0 auto;
    margin-left: rem(9);
    width: rem(27);
    height: rem(26);
    position: relative;
    &:first-child {
      margin-left: 0;
    }

    .background {
      display: block;
      width: 100%;
      height: 100%;
      background: url(https://g.smartcinemausa.com/images/8860ece107bc407f931ee706c07a9648-54-52.png) left center no-repeat;
      background-size: rem(27);
      filter: saturate(0);
    }
    .fill {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url(https://g.smartcinemausa.com/images/8860ece107bc407f931ee706c07a9648-54-52.png) left center no-repeat;
      background-size: rem(27);
    }
  }

}
</style>
