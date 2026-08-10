export interface TreeItem {
  id: string | number;
  parent: string | number | null;
}

export interface TableRowItem extends TreeItem {
  label: string;
}
