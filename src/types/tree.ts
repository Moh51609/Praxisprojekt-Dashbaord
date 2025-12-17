export interface TreeNode {
  id: string;
  name: string;
  type: "Package" | "Class" | "Port" | "Property";
  children: TreeNode[];
  original: any;
}
