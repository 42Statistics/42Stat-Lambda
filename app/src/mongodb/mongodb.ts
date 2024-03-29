import type { COALITIONS_USER_COLLECTION } from '#lambda/coalitionsUser/coalitionsUser.js';
import type { CURSUS_USER_COLLECTION } from '#lambda/cursusUser/cursusUser.js';
import type { EVENT_COLLECTION } from '#lambda/event/event.js';
import type { EVENTS_USER_COLLECTION } from '#lambda/eventsUser/eventsUser.js';
import type { EXAM_COLLECTION } from '#lambda/exam/exam.js';
import type { EXPERIENCE_USER_COLLECTION } from '#lambda/experience/experience.js';
import type { LOCATION_COLLECTION } from '#lambda/location/location.js';
import type { PROJECT_COLLECTION } from '#lambda/project/project.js';
import type { PROJECT_SESSION_COLLECTION } from '#lambda/projectSession/projectSession.js';
import type { PROJECT_SESSIONS_SKILL_COLLECTION } from '#lambda/projectSessionsSkill/projectSessionsSkill.js';
import type { PROJECTS_USER_COLLECTION } from '#lambda/projectsUser/projectsUser.js';
import type { QUESTS_USER_COLLECTION } from '#lambda/questsUser/questsUser.js';
import type { SCALE_TEAM_COLLECTION } from '#lambda/scaleTeam/scaleTeam.js';
import type { SCORE_COLLECTION } from '#lambda/score/score.js';
import type { SKILL_COLLECTION } from '#lambda/skill/skill.js';
import type { TEAM_COLLECTION } from '#lambda/team/team.js';
import type { USER_COLLECTION } from '#lambda/user/user.js';
import { Bound } from '#lambda/util/decorator.js';
import { LambdaError } from '#lambda/util/error.js';
import {
  MongoClient,
  type Db,
  type DbOptions,
  type DeleteResult,
  type Document,
  type Filter,
  type MongoClientOptions,
} from 'mongodb';

export const LOG_COLLECTION = 'logs';
export const PRUNE_COLLECTION = 'prunes';

type LogUpdatedAt =
  | typeof CURSUS_USER_COLLECTION
  | typeof EXAM_COLLECTION
  | typeof EXPERIENCE_USER_COLLECTION
  | typeof PROJECTS_USER_COLLECTION
  | typeof TEAM_COLLECTION
  | typeof LOCATION_COLLECTION
  | typeof QUESTS_USER_COLLECTION
  | typeof EVENT_COLLECTION
  | typeof EVENTS_USER_COLLECTION
  | typeof SCALE_TEAM_COLLECTION
  | typeof PROJECT_COLLECTION
  | typeof COALITIONS_USER_COLLECTION
  | typeof PROJECT_SESSION_COLLECTION
  | typeof SKILL_COLLECTION
  | typeof SCORE_COLLECTION
  | typeof PROJECT_SESSIONS_SKILL_COLLECTION
  | typeof USER_COLLECTION;

export class LambdaMongo implements AsyncDisposable {
  static async createInstance(
    url: string,
    mongoOptions?: MongoClientOptions,
  ): Promise<LambdaMongo> {
    const client = new MongoClient(url, {
      maxPoolSize: 16,
      minPoolSize: 16,
      maxIdleTimeMS: 1000 * 5,
      ...mongoOptions,
    });

    await client.connect();

    return new LambdaMongo(client);
  }

  private readonly client: MongoClient;
  private readonly mode: 'prod' | 'dev';

  private constructor(mongo: MongoClient) {
    this.client = mongo;

    this.mode = process.env.DEV ? 'dev' : 'prod';
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.client.close();
  }

  @Bound
  db(dbName?: string, options?: DbOptions): Db {
    return this.client.db(dbName, options);
  }

  /**
   *
   * @description
   * collection 의 updatedAt 기록을 기반으로 callback 을 실행시킨 후, 인자로 제공된 end 로
   * updatedAt 의 값을 갱신합니다.
   */
  @Bound
  @MongoAction
  async withCollectionUpdatedAt({
    end,
    collection,
    callback,
  }: {
    end: Date;
    collection: LogUpdatedAt;
    callback: (start: Date, end: Date) => Promise<void>;
  }): Promise<void> {
    const start = await this.getCollectionUpdatedAt(collection);

    await callback(start, end);

    await this.setCollectionUpdatedAt(collection, end);
  }

  @Bound
  @MongoAction
  async getCollectionUpdatedAt(collection: LogUpdatedAt): Promise<Date> {
    const collectionLog = await this.client
      .db()
      .collection(LOG_COLLECTION)
      .findOne<{ updatedAt: Date }>({ collection });

    if (collectionLog) {
      return collectionLog.updatedAt;
    }

    return new Date(0);
  }

  @Bound
  @MongoAction
  async setCollectionUpdatedAt(
    collection: LogUpdatedAt,
    updatedAt: Date,
  ): Promise<void> {
    if (this.mode === 'dev') {
      console.debug('aborting in[up]serting in dev mode');
      return;
    }

    await this.client
      .db()
      .collection(LOG_COLLECTION)
      .updateOne(
        { collection },
        { $set: { collection, updatedAt } },
        { upsert: true },
      );
  }

  @Bound
  @MongoAction
  async getDocuemntCount(collection: string): Promise<number> {
    const count = await this.client
      .db()
      .collection(collection)
      .estimatedDocumentCount();

    return count;
  }

  /**
   *
   * @description
   * 인자로 들어온 ```datas``` 를 map 과 Promise.all 을 통해 실행하기 때문에, 빈 배열이 삽입되는
   * 경우를 자연스럽게 막을 수 있습니다.
   */
  @Bound
  @MongoAction
  async upsertManyById<T extends { id: number }>(
    collection: string,
    datas: T[],
  ): Promise<void> {
    if (this.mode === 'dev') {
      console.debug('aborting in[up]sert in dev mode');
      return;
    }

    if (!datas.length) {
      return;
    }

    await Promise.all(
      datas.map((data) =>
        this.client
          .db()
          .collection(collection)
          .updateOne({ id: data.id }, { $set: data }, { upsert: true }),
      ),
    );
  }

  @Bound
  @MongoAction
  async deleteMany(
    collection: string,
    filter?: Filter<Document>,
  ): Promise<DeleteResult | undefined> {
    if (this.mode === 'dev') {
      console.debug('aborting deleteMany in dev mode');
      return;
    }

    return await this.client.db().collection(collection).deleteMany(filter);
  }

  @Bound
  @MongoAction
  async pruneMany(
    collection: string,
    filter?: Filter<Document>,
  ): Promise<DeleteResult | undefined> {
    if (this.mode === 'dev') {
      console.debug('aborting pruneMany in dev mode');
      return;
    }

    console.log(`pruning ${collection}`);

    const deleting = await this.client
      .db()
      .collection(collection)
      .find(filter ?? {})
      .toArray();

    if (!deleting.length) {
      console.log(`${collection}: nothing to prune`);
      return;
    }

    await this.client
      .db()
      .collection(PRUNE_COLLECTION)
      .insertMany(deleting.map((el) => ({ ...el, __collection: collection })));

    const deleteResult = await this.deleteMany(collection, filter);

    console.log(`delete ${collection}: ${deleteResult?.deletedCount ?? 0}`);

    return deleteResult;
  }

  @Bound
  @MongoAction
  async closeConnection(): Promise<void> {
    await this.client.close();
  }
}

// todo: UpdateAction 으로 통일?
/**
 *
 * @description
 * mongodb 와 상호작용할 때 발생할 수 있는 exception 을 ```LambdaErorr``` 로 바꿔주는 데코레이터
 * 입니다.
 */
// eslint-disable-next-line
function MongoAction<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): typeof target {
  function replacementMethod(this: This, ...args: Args): Return {
    try {
      const result = target.call(this, ...args);
      return result;
    } catch (e) {
      throw new LambdaError(
        'Mongo error at: ' + String(context.name) + JSON.stringify(e),
      );
    }
  }

  return replacementMethod;
}
