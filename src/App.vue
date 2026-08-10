<script setup lang="ts">
import { TreeGrid, TreeStore } from '@/features/tree-viewer';
import { initialItems } from '@/shared/mock/treeData';

const treeStore = new TreeStore(initialItems);
</script>

<template>
  <div class="app-layout">
    <main class="app-content">
      <TreeGrid :store="treeStore"/>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  background-color: #f0f2f5;
  color: #333;
}

.app-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}
</style>
