import { describe, it, expect, beforeEach } from 'vitest';
import { TreeStore } from './TreeStore';
import type { TableRowItem } from './types';
import { initialItems } from '@/shared/mock/treeData';

describe('TreeStore', () => {
  let mockItems: TableRowItem[];
  let store: TreeStore<TableRowItem>;

  beforeEach(() => {
    mockItems = initialItems;
    store = new TreeStore<TableRowItem>(mockItems);
  });

  it('должен возвращать все переданные элементы без изменений', () => {
    const allItems = store.getAll();
    expect(allItems).toHaveLength(mockItems.length);
    expect(allItems).toEqual(expect.arrayContaining(mockItems));
  });

  it('должен стабильно находить каждый элемент по его ID', () => {
    mockItems.forEach((target) => {
      const found = store.getItem(target.id);
      expect(found).toBeDefined();
      expect(found).toEqual(target);
    });
  });

  it('должен возвращать пустой массив для гарантированно несуществующего id', () => {
    // Собираем абсолютно все текущие ID в виде строк для безопасного сравнения
    const existingIds = new Set(mockItems.map(item => String(item.id)));

    // Генерируем уникальную строку, которой точно нет среди существующих ID
    let nonExistentId = `non-existent-id-${Date.now()}`;

    // На случай микросекундных совпадений (хотя это почти невозможно) гарантируем уникальность в цикле
    while (existingIds.has(nonExistentId)) {
      nonExistentId += '-unique';
    }

    expect(store.getChildren(nonExistentId)).toEqual([]);
    expect(store.getAllChildren(nonExistentId)).toEqual([]);
  });

  it('должен находить только прямых потомков, если они существуют', () => {
    // Ищем элемент, у которого точно есть дети
    const parentWithChildren = mockItems.find((p) =>
      mockItems.some((c) => c.parent === p.id),
    )!;

    const children = store.getChildren(parentWithChildren.id);
    expect(children.length).toBeGreaterThan(0);

    children.forEach((child) => {
      expect(child.parent).toBe(parentWithChildren.id);
    });
  });

  it('должен возвращать пустой массив, если у элемента нет дочерних узлов', () => {
    // Находим конечный лист дерева (на его ID никто не ссылается)
    const leafItem = mockItems.find(
      (p) => !mockItems.some((c) => c.parent === p.id),
    )!;

    const children = store.getChildren(leafItem.id);
    expect(children).toEqual([]);
  });

  it('должен собирать полную иерархическую цепочку родителей до самого корня', () => {
    // Находим самый глубокий элемент в иерархии (его родитель сам имеет родителя)
    const deepestItem = mockItems.find(
      (p) =>
        p.parent !== null &&
        mockItems.some(
          (parent) => parent.id === p.parent && parent.parent !== null,
        ),
    )!;

    const parents = store.getAllParents(deepestItem.id);
    expect(parents.length).toBeGreaterThan(1);

    // Проверяем хронологический порядок цепочки
    expect(parents[0].id).toBe(deepestItem.id);
    expect(parents[parents.length - 1].parent).toBeNull();

    // Проверяем непрерывность ссылок
    for (let i = 0; i < parents.length - 1; i++) {
      expect(parents[i].parent).toBe(parents[i + 1].id);
    }
  });

  it('должен каскадно удалять ветку и всех её вложенных потомков', () => {
    // Находим узел, у которого точно есть дети (середина или корень дерева)
    const targetToDelete = mockItems.find((p) =>
      mockItems.some((c) => c.parent === p.id),
    )!;

    const expectedDeletedIds = [
      targetToDelete.id,
      ...store.getAllChildren(targetToDelete.id).map((c) => c.id),
    ];

    store.removeItem(targetToDelete.id);

    // Ни один из удаленных ID не должен остаться в кэше
    expectedDeletedIds.forEach((id) => {
      expect(store.getItem(id)).toBeUndefined();
    });

    if (targetToDelete.parent !== null) {
      const parentChildren = store.getChildren(targetToDelete.parent);
      expect(parentChildren.map((c) => c.id)).not.toContain(targetToDelete.id);
    }
  });

  it('должен корректно изменять структуру связей при переносе элемента к другому родителю', () => {
    // Находим элемент, который можно переместить (не корень)
    const itemToMove = mockItems.find((p) => p.parent !== null)!;
    // Находим для него нового потенциального родителя (любой другой узел)
    const newParent = mockItems.find(
      (p) => p.id !== itemToMove.id && p.id !== itemToMove.parent,
    )!;

    const updatedItem = { ...itemToMove, parent: newParent.id };
    store.updateItem(updatedItem);

    // Проверяем успешное перемещение во всех индексах Map
    expect(store.getItem(itemToMove.id)?.parent).toBe(newParent.id);
    expect(store.getChildren(newParent.id).map((c) => c.id)).toContain(
      itemToMove.id,
    );

    if (itemToMove.parent !== null) {
      expect(
        store.getChildren(itemToMove.parent).map((c) => c.id),
      ).not.toContain(itemToMove.id);
    }
  });

  it('должен выбрасывать исключение при обнаружении циклических ссылок', () => {
    const cyclicItems: TableRowItem[] = [
      { id: 901, parent: 902, label: 'Cyclic 1' },
      { id: 902, parent: 901, label: 'Cyclic 2' },
    ];
    const cyclicStore = new TreeStore<TableRowItem>(cyclicItems);

    expect(() => cyclicStore.getAllParents(901)).toThrow('[TreeStore Error]');
    expect(() => cyclicStore.getAllChildren(901)).toThrow('[TreeStore Error]');
  });
});
