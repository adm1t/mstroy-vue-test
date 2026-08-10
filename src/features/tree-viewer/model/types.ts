export type TreeItemId = string | number;
export type TreeItemParent = string | number | null;

export interface TreeItem {
  id: TreeItemId;
  parent: TreeItemParent;
}

export interface TableRowItem extends TreeItem {
  label: string;
}
