import { type TreeItem } from './types';

/**
 * Универсальный класс для работы с древовидными структурами данных.
 */
export class TreeStore<T extends TreeItem = TreeItem> {
  private itemsMap = new Map<TreeItem['id'], T>();
  private childrenMap = new Map<TreeItem['parent'], T[]>();

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
  public getItem(id: TreeItem['id']): T | undefined {
    return this.itemsMap.get(id);
  }

  /**
   * Возвращает массив прямых потомков элемента
   */
  public getChildren(id: TreeItem['id']): T[] {
    return this.childrenMap.get(id) || [];
  }

  /**
   * Возвращает потомков на всех уровнях вложенности.
   */
  public getAllChildren(id: TreeItem['id']): T[] {
    const result: T[] = [];
    const queue: (string | number)[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
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
  public getAllParents(id: TreeItem['id']): T[] {
    const result: T[] = [];
    let currentItem = this.getItem(id);

    while (currentItem) {
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
  public removeItem(id: TreeItem['id']): void {
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
        parentChildren.filter((child) => child.id !== id)
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
          oldChildren.filter((c) => c.id !== updatedItem.id)
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
