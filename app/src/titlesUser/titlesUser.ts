import { MongoClient } from 'mongodb';
import { getDocuemntCount, upsertManyById } from '../mongodb/mongodb.js';
import {
  FetchApiAction,
  LogAsyncDocumentCount,
  LogAsyncEstimatedTime,
  UpdateAction,
} from '../util/decorator.js';
import { pagedRequestByCount } from '../util/pagedRequestByCount.js';
import {
  TITLES_USER_EP,
  TitlesUser,
  parseTitlesUsers,
} from './api/titlesUser.api.js';

export const TITLES_USER_COLLECTION = 'titles_users';

// eslint-disable-next-line
export class TitlesUserUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateFromLastPage(mongoClient);
  }

  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateFromLastPage(
    mongoClient: MongoClient,
  ): Promise<void> {
    const docCount = await getDocuemntCount(
      mongoClient,
      TITLES_USER_COLLECTION,
    );

    const titlesUsers = await this.fetchFromLastPage(docCount);

    await upsertManyById(mongoClient, TITLES_USER_COLLECTION, titlesUsers);
  }

  @FetchApiAction
  @LogAsyncDocumentCount
  private static async fetchFromLastPage(
    docCount: number,
  ): Promise<TitlesUser[]> {
    const titlesUserDtos = await pagedRequestByCount(
      TITLES_USER_EP.FROM_LAST_PAGE(),
      docCount,
      100,
    );

    return parseTitlesUsers(titlesUserDtos);
  }
}
