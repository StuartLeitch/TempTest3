import { VError } from 'verror';
import axios from 'axios';

import { LoggerContract } from '../../../../infrastructure/logging/LoggerContract';
import { AsyncLock } from '../../../../core/logic/AsyncLock';

import { ExchangeRate } from '../../domain/ExchangeRate';
import { Currency } from '../../domain/Currency';

import { ExchangeRateRepoContract } from '../../repos';

import { ExchangeRateServiceContract } from '../exchangeRateService';

interface AbstractHistoricResponse {
  converted_amount: number;
  exchange_rate: number;
  base_amount: number;
  target: string;
  base: string;
  date: string;
}

interface AbstractLiveResponse {
  exchange_rates: Record<string, number>;
  last_updated: number;
  base: string;
}

export class AbstractApiExchangeRateService
  implements ExchangeRateServiceContract
{
  private readonly defaultExchangeRate: ExchangeRate;

  constructor(
    private readonly exchangeRateRepo: ExchangeRateRepoContract,
    private readonly logger: LoggerContract,
    private readonly apiKey: string
  ) {
    this.defaultExchangeRate = Object.freeze(
      ExchangeRate.create({
        date: Object.freeze(new Date(0)),
        from: Currency.USD,
        to: Currency.GBP,
        rate: 1.42,
      })
    );
  }

  async getExchangeRate(
    exchangeDate: Date | undefined | null
  ): Promise<ExchangeRate> {
    if (!exchangeDate) {
      return this.defaultExchangeRate;
    }

    if (exchangeDate.getUTCFullYear() < 2000) {
      return this.defaultExchangeRate;
    }

    const firstOfMonthExchangeDate = new Date(exchangeDate);
    firstOfMonthExchangeDate.setUTCDate(1);

    const LockKey = `ExchangeRate${createYearMonthString(
      firstOfMonthExchangeDate
    )}`;

    let exists = await this.exchangeRateRepo.exchangeRateExistsForDate(
      firstOfMonthExchangeDate
    );

    if (exists) {
      this.logger.info(
        `Retrieving exchange rate from the DB for the date ${createDateString(
          firstOfMonthExchangeDate
        )}`
      );
      return this.exchangeRateRepo.getExchangeRate(firstOfMonthExchangeDate);
    }

    await AsyncLock.acquire(LockKey);

    try {
      /*
      We recheck the existence of the exchange rate after the lock acquisition
      in case that a parallel call updated the db with the needed exchange
      rate, so that we reduce the wait time for lock acquisition
      Reading: https://en.wikipedia.org/wiki/Double-checked_locking
    */
      exists = await this.exchangeRateRepo.exchangeRateExistsForDate(
        firstOfMonthExchangeDate
      );

      if (exists) {
        this.logger.info(
          `Retrieving exchange rate from the DB for the date ${createDateString(
            firstOfMonthExchangeDate
          )}, after DCL`
        );
        return await this.exchangeRateRepo.getExchangeRate(
          firstOfMonthExchangeDate
        );
      }

      this.logger.info(
        `No exchange rate available in DB for date ${createDateString(
          firstOfMonthExchangeDate
        )}`
      );

      try {
        const exchangeRate = await this.getExternalExchangeRate(
          firstOfMonthExchangeDate
        );

        exchangeRate.date.setUTCDate(1);
        await this.exchangeRateRepo.save(exchangeRate);

        return exchangeRate;
      } catch (err) {
        this.logger.info(
          `AbstractApi not available, searching for closest exchange rate in DB`
        );
      }
    } catch (err) {
      this.logger.error(
        `Error encountered in the locking section of AbstractApiExchangeRateService, releasing lock. Error: ${err}`
      );
      throw err;
    } finally {
      AsyncLock.release(LockKey);
    }

    try {
      const exchangeRate = await this.exchangeRateRepo.getClosestExchangeRate(
        firstOfMonthExchangeDate
      );

      this.logger.info(
        `Found closest exchange rate on ${createDateString(exchangeRate.date)}`
      );

      return exchangeRate;
    } catch (err) {
      this.logger.error(
        `No exchange rate found for date ${createDateString(
          firstOfMonthExchangeDate
        )}, using the default exchange rate of 1.42`
      );

      return this.defaultExchangeRate;
    }
  }

  private async getExternalExchangeRate(
    exchangeDate: Date
  ): Promise<ExchangeRate> {
    const requestedDateString = createDateString(exchangeDate);
    const todayString = createDateString(new Date());

    let exchangeRate: number;

    try {
      if (todayString === requestedDateString) {
        exchangeRate = await this.getTodayExchangeRate();
      } else {
        exchangeRate = await this.getHistoricExchangeRate(exchangeDate);
      }
    } catch (err) {
      this.logger.error(err.response.data.error, err.response);
      throw new VError(err.response.data.error);
    }

    return ExchangeRate.create({
      date: exchangeDate,
      from: Currency.USD,
      rate: exchangeRate,
      to: Currency.GBP,
    });
  }

  private async getHistoricExchangeRate(exchangeDate: Date): Promise<number> {
    const exchangeDateString = createDateString(exchangeDate);
    const req = this.createHistoricRequest(exchangeDateString);

    this.logger.info(
      `Retrieving historical exchange rate from AbstractApi for date ${exchangeDateString}`
    );

    const resp = await axios.get<AbstractHistoricResponse>(req);

    return resp.data.exchange_rate;
  }

  private async getTodayExchangeRate(): Promise<number> {
    const req = this.createLatestRequest();

    this.logger.info(`Retrieving latest exchange rate from AbstractApi`);

    const resp = await axios.get<AbstractLiveResponse>(req);

    return resp.data.exchange_rates[Currency.GBP];
  }

  private createHistoricRequest(exchangeDate: string): string {
    const baseExchangeUrl = 'https://exchange-rates.abstractapi.com/v1/convert';
    const apiKey = `api_key=${this.apiKey}`;
    const requestDate = `date=${exchangeDate}`;
    const currency = `base=${Currency.GBP}&target=${Currency.USD}`;
    return `${baseExchangeUrl}?${apiKey}&${requestDate}&${currency}`;
  }

  private createLatestRequest(): string {
    const baseExchangeUrl = 'https://exchange-rates.abstractapi.com/v1/live';
    const apiKey = `api_key=${this.apiKey}`;
    const currency = `base=${Currency.GBP}&target=${Currency.USD}`;
    return `${baseExchangeUrl}?${apiKey}&${currency}`;
  }
}

function createYearMonthString(date: Readonly<Date> | Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
}

function createDateString(date: Readonly<Date> | Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return `${year}-${month}-${day}`;
}
