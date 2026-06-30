<script setup lang="ts"></script>

<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.blank-layout {
  min-block-size: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
