import http from 'http';
import { Consumer } from '../../consumer';

export class HttpPublishConsumer<T> implements Consumer<T> {
  constructor(
    private host: string,
    private token: string,
    private logger: any
  ) {}

  async consume(objects: T | T[]): Promise<void> {
    const events = [].concat(objects);

    try {
      await this.sendEvent(events);
      this.logger.info('Sent ' + events.length + ' events');
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async sendEvent(data: any[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const options = {
        method: 'PUT',
        headers: {
          'x-auth-token': this.token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = http.request(this.host, options, res => {
        if (res.statusCode === 403) {
          throw new Error('Bad auth token');
        }
        if (res.statusCode >= 400) {
          reject('Bad request, status code: ' + res.statusCode);
          return;
        }
        let chunk = [];
        res.setEncoding('utf8');
        res.on('data', d => {
          chunk.push(d);
        });
        res.on('end', () => {
          resolve(chunk);
        });
      });
      req.on('error', e => reject(e));
      req.write(postData);
      req.end();
    });
  }
}
