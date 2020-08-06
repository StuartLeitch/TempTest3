import { PayPalRequest } from './request';

export interface Response<T> {
  headers: Record<string, unknown>;
  statusCode: number;
  result: T;
}

interface AccessToken {
  isExpired(): boolean;
  authorizationString(): string;
}

export interface PayPalHttpClient {
  getUserAgent(): string;
  execute<T>(request: PayPalRequest): Promise<Response<T>>;
  fetchAccessToken(): Promise<Response<AccessToken>>;
  getTimeout(): number;
}
