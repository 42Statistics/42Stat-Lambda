import { MongoClient } from 'mongodb';
import {
  FetchApiAction,
  LogAsyncDocumentCount,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { getDocuemntCount, upsertManyById } from '../mongodb/mongodb.js';
import { TITLE_EP, Title, parseTitles } from './api/title.api.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';

export const TITLE_COLLECTION = 'titles';

// eslint-disable-next-line
export class TitleUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateFromLastPage(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFromLastPage(
    mongoClient: MongoClient,
  ): Promise<void> {
    const documentCount = await getDocuemntCount(mongoClient, TITLE_COLLECTION);

    const titles = await this.fetchFromLastPage(documentCount);

    await upsertManyById(mongoClient, TITLE_COLLECTION, titles);
  }

  @FetchApiAction
  @LogAsyncDocumentCount
  private static async fetchFromLastPage(
    documentCount: number,
  ): Promise<Title[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLE_EP.FROM_LAST_PAGE(),
      documentCount,
      100,
    );

    return parseTitles(titlesUserDtos);
  }
}
