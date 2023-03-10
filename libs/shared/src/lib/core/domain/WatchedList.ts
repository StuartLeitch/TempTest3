export abstract class WatchedList<T> {
  public currentItems: T[];
  private initial: T[];
  private new: T[];
  private removed: T[];

  get length(): number {
    return this.currentItems.length;
  }

  constructor(initialItems?: T[]) {
    this.currentItems = initialItems ? initialItems : [];
    this.initial = initialItems ? initialItems : [];
    this.new = [];
    this.removed = [];
  }

  abstract compareItems(a: T, b: T): boolean;

  public getItems(): T[] {
    return this.currentItems;
  }

  public getNewItems(): T[] {
    return this.new;
  }

  public getRemovedItems(): T[] {
    return this.removed;
  }

  private isCurrentItem(item: T): boolean {
    return (
      this.currentItems.filter((v: T) => this.compareItems(item, v)).length !==
      0
    );
  }

  private isNewItem(item: T): boolean {
    return this.new.filter((v: T) => this.compareItems(item, v)).length !== 0;
  }

  private isRemovedItem(item: T): boolean {
    return (
      this.removed.filter((v: T) => this.compareItems(item, v)).length !== 0
    );
  }

  private removeFromNew(item: T): void {
    this.new = this.new.filter((v) => !this.compareItems(v, item));
  }

  private removeFromCurrent(item: T): void {
    this.currentItems = this.currentItems.filter(
      (v) => !this.compareItems(item, v)
    );
  }

  private removeFromRemoved(item: T): void {
    this.removed = this.removed.filter((v) => !this.compareItems(item, v));
  }

  private wasAddedInitially(item: T): boolean {
    return (
      this.initial.filter((v: T) => this.compareItems(item, v)).length !== 0
    );
  }

  public exists(item: T): boolean {
    return this.isCurrentItem(item);
  }

  public add(item: T): void {
    if (this.isRemovedItem(item)) {
      this.removeFromRemoved(item);
    }

    if (!this.isNewItem(item) && !this.wasAddedInitially(item)) {
      this.new.push(item);
    }

    if (!this.isCurrentItem(item)) {
      this.currentItems.push(item);
    }
  }

  public remove(item: T): void {
    this.removeFromCurrent(item);

    if (this.isNewItem(item)) {
      this.removeFromNew(item);
      return;
    }

    if (!this.isRemovedItem(item)) {
      this.removed.push(item);
    }
  }

  public forEach(fn: (c: T, i: number, arr: T[]) => void, t?: any): void {
    return this.currentItems.forEach(fn, t);
  }

  public map<U>(fn: (c: T, i: number, arr: T[]) => U, t?: any): U[] {
    return this.currentItems.map(fn, t);
  }

  public filter<S extends T>(
    fn: (c: T, i: number, arr: T[]) => c is S,
    t?: any
  ): S[];
  public filter(fn: (c: T, i: number, arr: T[]) => unknown, t?: any): T[];
  public filter(fn: (c: T, i: number, arr: T[]) => unknown, t?: any): T[] {
    return this.currentItems.filter(fn, t);
  }

  public reduce(fn: (acc: T, c: T, i: number, arr: T[]) => T): T;
  public reduce(fn: (acc: T, c: T, i: number, arr: T[]) => T, base: T): T;
  public reduce<U>(fn: (acc: U, c: T, i: number, arr: T[]) => U, base: U): U;
  public reduce<U>(fn: (acc: U, c: T, i: number, arr: T[]) => U, base?: U): U {
    return this.currentItems.reduce(fn, base);
  }
}
