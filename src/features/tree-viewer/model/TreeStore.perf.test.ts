import { describe, it, expect, beforeEach } from 'vitest';
import { TreeStore } from './TreeStore';
import { type TableRowItem } from './types';

describe('TreeStore - Тесты производительности (Performance)', () => {
  let largeData: TableRowItem[] = [];
  let store: TreeStore<TableRowItem>;
  const TOTAL_ITEMS = 100_000;

  beforeEach(() => {
    largeData = [];
    // Генерируем массив со случайной, но валидной иерархией
    for (let i = 1; i <= TOTAL_ITEMS; i++) {
      // Каждый элемент, кроме первого, имеет случайного родителя из уже созданных
      const parentId = i === 1 ? null : Math.floor(Math.random() * (i - 1)) + 1;
      largeData.push({
        id: i,
        parent: parentId,
        label: `Элемент №${i}`,
      });
    }

    store = new TreeStore<TableRowItem>(largeData);
  });

  it(`должен мгновенно искать элемент по ID на базе из ${TOTAL_ITEMS} объектов`, () => {
    const targetId = TOTAL_ITEMS - 50; // Берем элемент ближе к концу базы

    const start = performance.now();
    const item = store.getItem(targetId);
    const end = performance.now();

    const duration = end - start;

    console.log(
      `[Perf Log]: Поиск getItem на ${TOTAL_ITEMS} элементах занял: ${duration.toFixed(4)} мс`,
    );

    expect(item).toBeDefined();

    // Константное время O(1) на хэш-картах в JS обычно занимает меньше 0.05 миллисекунды
    expect(duration).toBeLessThan(1.0);
  });

  it('должен эффективно выполнять итеративный каскадный обход детей', () => {
    // Выбираем корневой элемент (id: 1), у которого будет больше всего потомков
    const start = performance.now();
    const allChildren = store.getAllChildren(1);
    const end = performance.now();

    const duration = end - start;

    console.log(
      `[Perf Log]: Каскадный обход getAllChildren занял: ${duration.toFixed(2)} мс (Найдено потомков: ${allChildren.length})`,
    );

    // Даже для огромного дерева итеративный обход BFS должен укладываться в разумные рамки (до 50-100мс максимум)
    expect(duration).toBeLessThan(100.0);
  });
});
