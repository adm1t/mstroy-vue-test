<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';

import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type GridReadyEvent,
  type GetDataPath,
  type ValueGetterParams,
  type GetRowIdFunc,
  type RowGroupOpenedEvent,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';

import { TreeStore } from '../model/TreeStore';
import { type TableRowItem } from '../model/types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const props = defineProps<{
  store: TreeStore<TableRowItem>;
}>();

const rowData = ref<TableRowItem[]>(props.store.getAll());

const getRowId: GetRowIdFunc<TableRowItem> = (params) => String(params.data.id);

const getDataPath: GetDataPath<TableRowItem> = (data) => {
  try {
    const rawData = toRaw(data);
    const parentsChain = props.store.getAllParents(rawData.id);
    return [...parentsChain].reverse().map((item) => String(item.id));
  } catch (error) {
    console.error('Ошибка построения дерева в Ag-Grid:', error);
    return [String(data.id)];
  }
};

const defaultColDef = ref<ColDef>({
  sortable: false,
  filter: false,
  suppressMovable: true,
  suppressHeaderMenuButton: true,
  resizable: false,
});

const columnDefs = computed<ColDef[]>(() => [
  {
    colId: 'rowNumber',
    headerName: '№ п\\п',
    valueGetter: (params: ValueGetterParams) => {
      if (params.node && typeof params.node.rowIndex === 'number') {
        return params.node.rowIndex + 1;
      }
      return null;
    },
    width: 80,
    suppressSizeToFit: true,
    cellClass: ['font-weight-bold', 'text-align-center'],
  },
  {
    headerName: 'Категория',
    flex: 1,
    showRowGroup: true,
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: true,
    },
    valueGetter: (params: ValueGetterParams) => {
      if (!params.data) return '';
      const hasChildren = props.store.getChildren(params.data.id).length > 0;
      return hasChildren ? 'Группа' : 'Элемент';
    },
    cellClassRules: {
      'font-weight-bold': (params) => {
        if (!params.data) return false;
        return props.store.getChildren(params.data.id).length > 0;
      },
    },
  },
  {
    headerName: 'Наименование',
    field: 'label',
    flex: 2,
    cellClassRules: {
      'font-weight-bold': (params) => {
        if (!params.data) return false;
        return props.store.getChildren(params.data.id).length > 0;
      },
    },
  },
]);

const gridApi = ref();

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  // При инициализации таблицы разворачиваем все вложенные элементы
  params.api.expandAll();
};

const onRowGroupOpened = (params: RowGroupOpenedEvent<TableRowItem>) => {
  if (params.api) {
    // Сбрасываем кэш ячеек и принудительно пересчитывает порядковые номера.
    params.api.refreshCells({
      columns: ['rowNumber'],
      force: true,
    });
  }
};
</script>

<template>
  <div class="tree-grid">
    <ag-grid-vue
      dom-layout="autoHeight"
      group-display-type="custom"
      :theme="themeQuartz"
      :column-defs="columnDefs"
      :default-col-def="defaultColDef"
      :row-data="rowData"
      :tree-data="true"
      :get-data-path="getDataPath"
      :getRowId="getRowId"
      :suppress-context-menu="true"
      :suppress-movable-columns="true"
      :suppress-cell-focus="true"
      @grid-ready="onGridReady"
      @row-group-opened="onRowGroupOpened"
    />
  </div>
</template>

<style scoped>
.tree-grid {
  --ag-header-column-border-height: 100%;
  --ag-header-font-weight: 700;
  --ag-header-column-border: 1px solid #ddddde;
}

:deep(.font-weight-bold) {
  font-weight: 700 !important;
}

:deep(.text-align-center) {
  text-align: center !important;
}
</style>
