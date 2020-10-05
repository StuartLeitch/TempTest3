import { S3EventProducer } from './s3-event-producer';
import { Selector } from '../../../selector';
import { Filter } from '../../../filters';

interface MockEvent {
  messageId: string;
  body: string;
}

let S3;

const mockKeys = [
  {
    Key: '1',
  },
  {
    Key: '2',
  },
  {
    Key: '3',
  },
];

const mockObjects = {
  '1': `{"messageId":"1","body":"{'a':'1'}"}`,
  '2': `{"messageId":"2","body":"{'a':'2'}"}`,
  '3': `{"messageId":"3","body":"{'a':'3'}"}`,
};

class MockSelector implements Selector<string> {
  private acceptedKeys: string[];

  constructor(acceptedKeys: string[]) {
    this.acceptedKeys = acceptedKeys;
  }
  shouldSelect(key: string): boolean {
    return this.acceptedKeys.includes(key);
  }

  select(keys: string[]): string[] {
    return keys.filter(this.shouldSelect.bind(this));
  }
}

class MockFilter implements Filter<MockEvent> {
  private acceptedEvents: string[];

  constructor(acceptedEvents: string[]) {
    this.acceptedEvents = acceptedEvents;
  }

  match(event: MockEvent): boolean {
    return this.acceptedEvents.includes(event.messageId);
  }
}

describe('S3 Event Producer', () => {
  beforeEach(() => {
    const s3ListObjectKeysV2 = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        IsTruncated: false,
        $response: {
          data: {
            Contents: mockKeys,
          },
        },
      }),
    });
    const s3GetObject = jest.fn(({ Key }) => {
      const values = mockObjects;
      return {
        promise: jest.fn().mockResolvedValue({
          $response: {
            data: {
              Body: values[Key],
            },
          },
        }),
      };
    });
    S3 = jest.fn().mockImplementation(() => ({
      listObjectsV2: s3ListObjectKeysV2,
      getObject: s3GetObject,
    }));
  });

  it('should get events from s3', async () => {
    const producer = new S3EventProducer(S3(), '');
    const list = producer.produce();
    const expectedResult = [
      { messageId: '1', body: "{'a':'1'}" },
      { messageId: '2', body: "{'a':'2'}" },
      { messageId: '3', body: "{'a':'3'}" },
    ];

    const results = [];
    for await (const event of list) {
      results.push(event);
    }
    expect(
      results.map((e) => ({ ...e, body: e.body.replace(' ', '') }))
    ).toEqual(
      expectedResult.map((e) => ({ ...e, body: e.body.replace(' ', '') }))
    );
  });

  it('should call getObjects only for the keys that match the selector', async () => {
    const s3 = S3();
    const producer = new S3EventProducer(s3, '');
    producer.addSelector(new MockSelector(['1', '3']));

    const list = producer.produce();

    const results = [];
    for await (const event of list) {
      results.push(event);
    }

    expect(s3.getObject.mock.calls[0][0].Key).toBe('1');
    expect(s3.getObject.mock.calls[1][0].Key).toBe('3');
  });

  it.skip('should call getObjects only for the keys that match the selector', async () => {
    const s3 = S3();
    const producer = new S3EventProducer(s3, '');
    producer.addFilter(new MockFilter(['1', '3']));

    const list = producer.produce();
    const expectedResult = [
      { messageId: '1', body: "{'a':'1'}" },
      { messageId: '3', body: "{'a':'3'}" },
    ];

    const results = [];
    for await (const event of list) {
      results.push(event);
    }

    expect(
      results.map((e) => ({ ...e, body: e.body.replace(' ', '') }))
    ).toEqual(
      expectedResult.map((e) => ({ ...e, body: e.body.replace(' ', '') }))
    );
    expect(s3.getObject.mock.calls[0][0].Key).toBe('1');
    expect(s3.getObject.mock.calls[1][0].Key).toBe('2');
    expect(s3.getObject.mock.calls[2][0].Key).toBe('3');
  });
});
