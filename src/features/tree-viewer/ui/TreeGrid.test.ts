import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TreeGrid from './TreeGrid.vue';
import { TreeStore } from '../model/TreeStore';
import type { TableRowItem } from '../model/types';

import { initialItems } from '@/shared/mock/treeData.ts';

// Мокаем компонент ag-grid-vue3
vi.mock('ag-grid-vue3', () => ({
  AgGridVue: {
    name: 'AgGridVue',
    template: '<div class="mocked-ag-grid"><slot /></div>',
    props: [
      'columnDefs',
      'rowData',
      'treeData',
      'getDataPath',
      'groupDisplayType',
      'getRowId',
      'defaultColDef',
    ],
  },
}));

vi.mock('ag-grid-enterprise', () => ({
  // Явно объявляем пустой экспорт, чтобы удовлетворить импорт в компоненте
  AllEnterpriseModule: {}
}));

describe('TreeGrid.vue', () => {
  let mockItems: TableRowItem[];
  let store: TreeStore<TableRowItem>;

  beforeEach(() => {
    mockItems = initialItems;
    store = new TreeStore<TableRowItem>(mockItems);
  });

  it('должен успешно монтироваться в DOM без критических ошибок', () => {
    const wrapper = mount(TreeGrid, {
      props: { store },
    });

    // Проверяем, что корневой контейнер компонента отрендерился
    expect(wrapper.find('.tree-grid').exists()).toBe(true);
  });

  it('должен правильно пробрасывать плоские данные из TreeStore в пропсы Ag-Grid', () => {
    const wrapper = mount(TreeGrid, {
      props: { store },
    });

    // Находим заглушку AgGridVue
    const agGridComp = wrapper.findComponent({ name: 'AgGridVue' });

    expect(agGridComp.exists()).toBe(true);

    // Проверяем, что в проп rowData улетел именно тот массив, который отдал store.getAll()
    expect(agGridComp.props('rowData')).toHaveLength(mockItems.length);
    expect(agGridComp.props('rowData')).toEqual(store.getAll());
  });

  it('должен принудительно включать режим древовидных данных и кастомный тип отображения групп', () => {
    const wrapper = mount(TreeGrid, {
      props: { store },
    });

    const agGridComp = wrapper.findComponent({ name: 'AgGridVue' });

    // Проверяем конфигурационные пропсы
    expect(agGridComp.props('treeData')).toBe(true);
    expect(agGridComp.props('groupDisplayType')).toBe('custom');
  });

  it('метод getDataPath должен корректно возвращать строковую цепочку ID для иерархии', () => {
    const wrapper = mount(TreeGrid, {
      props: { store },
    });

    const agGridComp = wrapper.findComponent({ name: 'AgGridVue' });
    const getDataPathFn = agGridComp.props('getDataPath');

    // ДИНАМИЧЕСКИЙ ТЕСТ-КЕЙС: берем последний (самый глубокий) элемент из моков
    const targetItem = mockItems[mockItems.length - 1];

    // Вычисляем эталонную цепочку родителей программно через методы стора
    const expectedPath = store
      .getAllParents(targetItem.id)
      .reverse()
      .map((item) => String(item.id));

    const actualPath = getDataPathFn(targetItem);

    expect(actualPath).toEqual(expectedPath);
  });
});
