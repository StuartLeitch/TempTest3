import { v4 as uuidV4 } from 'uuid';
import { SQS } from 'aws-sdk';

import { Producer } from './producer';

export class SqsEventProducer implements Producer {
  private queueUrl: string;
  private sqs: SQS;

  constructor(
    private readonly queueName: string,
    private readonly eventNamespace: string,
    private readonly publisherName: string,
    private readonly serviceName: string,
    private readonly region: string,
    private readonly defaultMessageAttributes: Record<string, unknown> = {},
    private readonly sqsEndpoint?: string,
    private readonly accessKeyId?: string,
    private readonly secretAccessKey?: string
  ) {
    let sqsOptions: SQS.ClientConfiguration = { region: this.region };

    if (accessKeyId && secretAccessKey && sqsEndpoint) {
      sqsOptions = {
        region: this.region,
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
        endpoint: this.sqsEndpoint,
      };
    }

    this.sqs = new SQS(sqsOptions);
  }

  async start() {
    const { QueueUrl } = await this.sqs
      .getQueueUrl({ QueueName: this.queueName })
      .promise();

    this.queueUrl = QueueUrl;
  }

  async sendEvent(
    data: unknown,
    event: string,
    timestamp: string = new Date().toISOString(),
    id: string = uuidV4(),
    messageAttributes: Record<string, unknown> = {}
  ) {
    const message = this.createEventMessage(event, data, timestamp, id);

    await this.sqs
      .sendMessage(this.createEventPayload(message, messageAttributes))
      .promise();
  }

  private getEventName(actionName: string) {
    return `${this.eventNamespace}:${this.publisherName}:${this.serviceName}:${actionName}`;
  }

  private createEventMessage(
    event: string,
    data: unknown,
    timestamp: string,
    id: string
  ): string {
    return JSON.stringify({
      event: this.getEventName(event),
      timestamp,
      data: JSON.stringify(data),
      id,
    });
  }

  private createEventPayload(
    MessageBody: string,
    messageAttributes: Record<string, unknown>
  ) {
    const attributes = Object.assign(
      {},
      this.defaultMessageAttributes,
      messageAttributes
    );

    const MessageAttributes = {};

    for (const prop in attributes) {
      MessageAttributes[prop] = {
        StringValue: attributes[prop],
        DataType: 'String',
      };
    }

    return {
      QueueUrl: this.queueUrl,
      MessageAttributes,
      MessageBody,
    };
  }
}
