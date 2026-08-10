import { type TreeItem, type TreeItemId, type TreeItemParent } from './types';

/**
 * Универсальный класс для работы с древовидными структурами данных.
 */
export class TreeStore<T extends TreeItem = TreeItem> {
  private itemsMap = new Map<TreeItemId, T>();
  private childrenMap = new Map<TreeItemParent, T[]>();

  constructor(items: T[]) {
    this.init(items);
  }

  /**
   * Первичная индексация плоского массива данных
   */
  private init(items: T[]): void {
    this.itemsMap.clear();
    this.childrenMap.clear();

    for (const item of items) {
      this.itemsMap.set(item.id, item);

      const parentId = item.parent;
      if (!this.childrenMap.has(parentId)) {
        this.childrenMap.set(parentId, []);
      }
      this.childrenMap.get(parentId)!.push(item);
    }
  }

  /**
   * Возвращает полный актуальный массив элементов
   */
  public getAll(): T[] {
    return Array.from(this.itemsMap.values());
  }

  /**
   * Возвращает объект элемента по id
   */
  public getItem(id: TreeItemId): T | undefined {
    return this.itemsMap.get(id);
  }

  /**
   * Возвращает массив прямых потомков элемента
   */
  public getChildren(id: TreeItemId): T[] {
    return this.childrenMap.get(id) || [];
  }

  /**
   * Возвращает потомков на всех уровнях вложенности.
   */
  public getAllChildren(id: TreeItemId): T[] {
    const result: T[] = [];
    const queue: TreeItemId[] = [id];

    // Храним уже посещенные ID для защиты от бесконечного цикла
    const visited = new Set<TreeItemId>();

    // Используем указатель вместо .shift(), чтобы не перестраивать массив в памяти
    let head = 0;

    while (head < queue.length) {
      const currentId = queue[head++];

      if (visited.has(currentId)) {
        throw new Error(
          `[TreeStore Error]: Обнаружено зацикливание при каскадном обходе детей! Элемент ID: ${currentId} зациклен.`,
        );
      }
      visited.add(currentId);

      const children = this.getChildren(currentId);

      if (children.length > 0) {
        result.push(...children);
        for (const child of children) {
          queue.push(child.id);
        }
      }
    }

    return result;
  }

  /**
   * Возвращает цепочку родителей от текущего элемента вверх до корня
   */
  public getAllParents(id: TreeItemId): T[] {
    const result: T[] = [];
    let currentItem = this.getItem(id);
    const visited = new Set<TreeItemId>();

    while (currentItem) {
      if (visited.has(currentItem.id)) {
        // Выбрасываем исключение — данные повреждены
        throw new Error(
          `[TreeStore Error]: Обнаружено зацикливание иерархии! Элемент ID: ${currentItem.id} зациклен через родителя.`,
        );
      }
      visited.add(currentItem.id);

      result.push(currentItem);

      if (currentItem.parent === null) {
        break;
      }
      currentItem = this.getItem(currentItem.parent);
    }

    return result;
  }

  /**
   * Добавляет новый элемент в структуру
   */
  public addItem(item: T): void {
    if (this.itemsMap.has(item.id)) return;

    this.itemsMap.set(item.id, item);

    const parentId = item.parent;
    if (!this.childrenMap.has(parentId)) {
      this.childrenMap.set(parentId, []);
    }
    this.childrenMap.get(parentId)!.push(item);
  }

  /**
   * Удаляет элемент и рекурсивно всех его потомков
   */
  public removeItem(id: TreeItemId): void {
    const itemToRemove = this.getItem(id);
    if (!itemToRemove) return;

    const targetsToRemove = [itemToRemove, ...this.getAllChildren(id)];

    // Удаляем элементы из индексов
    for (const target of targetsToRemove) {
      this.itemsMap.delete(target.id);
      this.childrenMap.delete(target.id);
    }

    // Удаляем узел из массива детей его родителя
    const parentId = itemToRemove.parent;
    const parentChildren = this.childrenMap.get(parentId);
    if (parentChildren) {
      this.childrenMap.set(
        parentId,
        parentChildren.filter((child) => child.id !== id),
      );
    }
  }

  /**
   * Обновляет поля существующего элемента
   */
  public updateItem(updatedItem: T): void {
    const oldItem = this.getItem(updatedItem.id);
    if (!oldItem) return;

    const oldParentId = oldItem.parent;
    const newParentId = updatedItem.parent;

    this.itemsMap.set(updatedItem.id, updatedItem);

    if (oldParentId !== newParentId) {
      // Удаляем из старого родителя
      const oldChildren = this.childrenMap.get(oldParentId);
      if (oldChildren) {
        this.childrenMap.set(
          oldParentId,
          oldChildren.filter((c) => c.id !== updatedItem.id),
        );
      }

      // Добавляем к новому родителю
      if (!this.childrenMap.has(newParentId)) {
        this.childrenMap.set(newParentId, []);
      }
      this.childrenMap.get(newParentId)!.push(updatedItem);
    } else {
      // Родитель прежний — просто обновляем объект в массиве детей
      const children = this.childrenMap.get(oldParentId);
      if (children) {
        const index = children.findIndex((c) => c.id === updatedItem.id);
        if (index !== -1) {
          children[index] = updatedItem;
        }
      }
    }
  }
}
