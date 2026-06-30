<script setup lang="ts"></script>

<template>
  <div class="forms-layout">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.forms-layout {
  min-block-size: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff4ff 0%, #f8f9fb 100%);
  padding: 24px;
}
</style>
