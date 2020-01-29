import { cloneDeep } from 'lodash';
import { S3 } from 'aws-sdk';

import { Event } from '../../../../modules/event';

import { Selector } from '../../../selector';
import { Filter } from '../../../filters';
import { Producer } from '../../producer';

import { splitS3ObjectIntoEvents } from './utils';

interface S3ObjectKeys {
  objects: S3.ObjectList;
  isTruncated: boolean;
}

export class S3EventProducer implements Producer<Event, string> {
  private defaultValues: Partial<Event> = {};
  private selectors: Selector<string>[] = [];
  private filters: Filter<Event>[] = [];
  private bucketName: string;
  private s3: S3;

  constructor(s3: S3, bucketName: string) {
    this.bucketName = bucketName;
    this.s3 = s3;
  }

  async *produce(): AsyncGenerator<Event, void, undefined> {
    const keys = this.getS3ObjectKeys();

    for await (const key of keys) {
      const contents = await this.getS3Object(key);
      const events = splitS3ObjectIntoEvents(contents)
        .filter(this.checkFilters.bind(this))
        .map(event => Object.assign(cloneDeep(this.defaultValues), event));
      yield* events;
    }
  }

  setDefaultValues(base: Partial<Event>): void {
    this.defaultValues = base;
  }

  addFilter(filter: Filter<Event>): void {
    this.filters.push(filter);
  }

  removeFilters(): void {
    this.filters = [];
  }

  addSelector(selector: Selector<string>): void {
    this.selectors.push(selector);
  }

  removeSelectors(): void {
    this.selectors = [];
  }

  private checkFilters(event: Event): boolean {
    for (const filter of this.filters) {
      if (!filter.match(event)) {
        return false;
      }
    }

    return true;
  }

  private checkSelectors(key: string): boolean {
    for (const selector of this.selectors) {
      if (!selector.shouldSelect(key)) {
        return false;
      }
    }

    return true;
  }

  private async *getS3ObjectKeys(): AsyncGenerator<string, void, undefined> {
    let lastKey = '';
    while (true) {
      const { isTruncated, objects } = await this.listObjects(lastKey);
      const keys = objects.map(obj => obj.Key);
      yield* keys.filter(this.checkSelectors.bind(this));

      if (!isTruncated) {
        lastKey = keys[keys.length - 1];
        break;
      }
    }
  }

  private async getS3Object(key: string): Promise<null | string> {
    const objectRequest = { Bucket: this.bucketName, Key: key };
    const object = await this.s3.getObject(objectRequest).promise();
    const data = object?.$response?.data;

    if (!data) {
      return null;
    }

    return data.Body.toString();
  }

  private async listObjects(startAfter: string): Promise<S3ObjectKeys> {
    const request = { Bucket: this.bucketName, StartAfter: startAfter };
    const response = await this.s3.listObjectsV2(request).promise();
    const data = response?.$response?.data;
    const objects = data ? data.Contents : [];

    return { isTruncated: response.IsTruncated || !data, objects };
  }
}
