export abstract class BaseMockRepo<T> {
  protected _items: T[];

  constructor() {
    this._items = [];
  }

  public addMockItem(t: T): void {
    let found = false;
    for (let item of this._items) {
      if (this.compareMockItems(item, t)) {
        found = true;
      }
    }

    if (!found) {
      this._items.push(t);
    }
  }

  public removeMockItem(t: T): void {
    this._items = this._items.filter(item => !this.compareMockItems(item, t));
  }

  abstract compareMockItems(a: T, b: T): boolean;
}
