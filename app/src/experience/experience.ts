import { MongoClient } from 'mongodb';
import { CursusUser } from '../cursusUser/api/cursusUser.api.js';
import {
  getCollectionUpdatedAt,
  setCollectionUpdatedAt,
} from '../mongodb/mongodb.js';
import type { Project } from '../project/api/project.api.js';
import { ProjectsUser } from '../projectsUser/api/projectsUser.api.js';
import { PROJECTS_USER_COLLECTION } from '../projectsUser/projectsUser.js';
import type { PassedTeam } from '../team/api/team.api.js';
import { LogAsyncEstimatedTime, UpdateAction } from '../util/decorator.js';
import { LambdaError } from '../util/error.js';
import { Experience } from './api/experience.api.js';

export const EXPERIENCE_COLLECTION = 'experience_users';
const LEVEL_COLLECTION = 'levels';

type LevelTableElem = {
  lvl: number;
  xp: number;
};

/**
 *
 *
 * @description
 * 자체적으로 계산하기 때문에 반드시 다른 api 업데이트부터 진행하고 update 를 호춣해야 합니다.
 *
 * 2023-05 기준
 * 필요 요청 수: 0
 * 예상 소요 시간: 1초
 *
 * experiances api 가 사용 가능해지는 날이 온다면, 다른 api 처럼 로직 수정을 할 수 있습니다.
 * 현 상황에선 외부에서 업데이트 해야 할 목록을 받아오는 방식으로 구성했습니다.
 *
 * 람다가 성공적으로 작동하는 사이에 두번 이상의 과제 통과가 발생하면 계산에 문제가 생깁니다만,
 * 현실적으로 이런 경우는 극소수거나 존재하지 않을 것으로 예상을 하고 있습니다.
 */
// eslint-disable-next-line
export class ExperienceUpdator {
  static async update(mongoClient: MongoClient): Promise<void> {
    await this.updateProjectsUserUpdated(mongoClient);
    await testLevelCalculation(mongoClient);
  }

  /**
   *
   * @description
   * 쿼리문을 통해 업데이트 해야할 projects user 들을 불러오고, 이를 통해 experience 를 계산합니다.
   * 쿼리문에서 걸러주지 못하는 경우는 직접 코드로 걸러내야 합니다.
   *
   * 쿼리문에서 걸러주지 못하는 경우
   * - 이전 team 이 현재 team 보다 점수가 높음
   */
  @UpdateAction
  @LogAsyncEstimatedTime
  private static async updateProjectsUserUpdated(
    mongoClient: MongoClient,
  ): Promise<void> {
    const start = await getCollectionUpdatedAt(
      mongoClient,
      EXPERIENCE_COLLECTION,
    );

    const projectsUsersUpdated = await mongoClient
      .db()
      .collection<ProjectsUser>(PROJECTS_USER_COLLECTION)
      .aggregate<
        Omit<ProjectsUser, 'project' | 'markedAt'> & {
          project: Project;
          markedAt: Date;
          cursusUser?: CursusUser;
          currTeam: PassedTeam;
          experienceUsers: Experience[];
        }
      >(
        //#region aggregation pipeline
        [
          {
            $match: {
              markedAt: { $gt: start },
              'project.name': { $not: { $regex: 'Exam' } },
              'validated?': true,
            },
          },
          {
            $addFields: {
              teams: {
                $sortArray: { input: '$teams', sortBy: { createdAt: 1 } },
              },
            },
          },
          {
            $addFields: {
              currTeam: { $last: '$teams' },
            },
          },
          {
            $match: {
              'currTeam.validated?': true,
            },
          },
          {
            $lookup: {
              from: 'projects',
              localField: 'project.id',
              foreignField: 'id',
              as: 'project',
            },
          },
          {
            $addFields: {
              project: { $first: '$project' },
            },
          },
          {
            $match: {
              'project.difficulty': { $ne: 0 },
            },
          },
          {
            $lookup: {
              from: 'cursus_users',
              localField: 'user.id',
              foreignField: 'user.id',
              as: 'cursusUser',
            },
          },
          {
            $addFields: {
              cursusUser: { $first: '$cursusUser' },
            },
          },
          {
            $lookup: {
              from: EXPERIENCE_COLLECTION,
              localField: 'user.id',
              foreignField: 'userId',
              as: 'experienceUsers',
            },
          },
        ],
        //#endregion
      )
      .toArray();

    if (!projectsUsersUpdated.length) {
      return;
    }

    const levelTable = await mongoClient
      .db()
      .collection<LevelTableElem>(LEVEL_COLLECTION)
      .find()
      .sort({ lvl: 1 })
      .toArray();

    const newExperiences = projectsUsersUpdated.reduce(
      (acc: Experience[], projectsUser) => {
        const currMark = projectsUser.currTeam.finalMark;
        const projectPrevExperience =
          projectsUser.experienceUsers.find(
            (experience) => experience.project.id === projectsUser.project.id,
          )?.experience ?? 0;
        const totalPrevExpereince = projectsUser.experienceUsers.reduce(
          (experienceSum, { experience }) => experienceSum + experience,
          0,
        );

        const [expWithoutBonus, expWithBonus] = calculateExperienceByMark(
          currMark,
          projectsUser.project,
          projectPrevExperience,
        );

        const levelWithoutBonus = calculateLevel(
          totalPrevExpereince + expWithoutBonus,
          levelTable,
        );

        const levelWithBonus = calculateLevel(
          totalPrevExpereince + expWithBonus,
          levelTable,
        );

        // cursus user update
        if (!projectsUser.cursusUser) {
          throw new LambdaError('data consistency', projectsUser);
        }

        const experience =
          Math.abs(levelWithBonus - projectsUser.cursusUser.level) <
          Math.abs(levelWithoutBonus - projectsUser.cursusUser.level)
            ? expWithBonus
            : expWithoutBonus;

        if (!experience) {
          return acc;
        }

        acc.push({
          userId: projectsUser.user.id,
          cursusId: projectsUser.cursusIds[0],
          createdAt: projectsUser.markedAt,
          experience,
          project: projectsUser.project,
        });

        return acc;
      },
      [],
    );

    if (newExperiences.length === 0) {
      return;
    }

    const end = newExperiences.reduce(
      (prev, { createdAt }) => (prev > createdAt ? prev : createdAt),
      new Date(0),
    );

    await mongoClient
      .db()
      .collection(EXPERIENCE_COLLECTION)
      .insertMany(newExperiences);

    await setCollectionUpdatedAt(mongoClient, EXPERIENCE_COLLECTION, end);
  }
}

/**
 *
 * @description
 * 점수와 프로젝트에 기반하여, 얻는 예상 경험치를 코알리숑 보너스가 있을 때와 없을 때로 나누어 반환합니다.
 *
 * @returns
 * [ 코알리숑 보너스 없는 경험치, 코알리숑 보너스 있는 경험치 ]
 */
const calculateExperienceByMark = (
  mark: number,
  project: Project,
  projectPrevExperience: number,
): [number, number] => {
  return [
    Math.max(
      Math.floor(project.difficulty * (mark / 100.0)) - projectPrevExperience,
      0,
    ),
    Math.max(
      Math.floor(project.difficulty * (mark / 100.0) * 1.042) -
        projectPrevExperience,
      0,
    ),
  ];
};

const calculateLevel = (
  experiences: number,
  levelTable: LevelTableElem[],
): number => {
  const upper = levelTable.find(({ xp }) => xp > experiences);
  assertsLevelFound(upper);

  const { lvl: upperLevel, xp: upperNeed } = upper;
  const { lvl: lowerLevel, xp: lowerNeed } = levelTable[upperLevel - 1];

  const levelFloat =
    Math.floor(
      (1 + (experiences - upperNeed) / (1.0 * (upperNeed - lowerNeed))) * 100 +
        Number.EPSILON,
    ) / 100;

  return lowerLevel + levelFloat;
};

function assertsLevelFound(
  levelElem: LevelTableElem | undefined,
): asserts levelElem is LevelTableElem {
  if (!levelElem) {
    throw new LambdaError('wrong calc logic');
  }
}

//#region 테스트 함수 입니다.
const testLevelCalculation = async (
  mongoClient: MongoClient,
): Promise<void> => {
  const info = await mongoClient
    .db()
    .collection('cursus_users')
    .aggregate<{
      user: {
        id: string;
      };
      level: number;
      experiences: number;
    }>([
      {
        $lookup: {
          from: EXPERIENCE_COLLECTION,
          localField: 'user.id',
          foreignField: 'userId',
          as: 'experiences',
        },
      },
      {
        $addFields: {
          experiences: { $sum: '$experiences.experience' },
        },
      },
    ])
    .toArray();

  const levelTable = await mongoClient
    .db()
    .collection<LevelTableElem>('levels')
    .find()
    .sort({ lvl: 1 })
    .toArray();

  const calcexp = (
    experiences: number,
    levelTable: LevelTableElem[],
  ): number => {
    const upper = levelTable.find(({ xp }) => xp > experiences);
    assertsLevelFound(upper);

    const { lvl: upperLevel, xp: upperNeed } = upper;
    const { lvl: lowerLevel, xp: lowerNeed } = levelTable[upperLevel - 1];

    const levelFloat =
      Math.floor(
        (1 + (experiences - upperNeed) / (1.0 * (upperNeed - lowerNeed))) *
          100 +
          Number.EPSILON,
      ) / 100;

    return lowerLevel + levelFloat;
  };

  let i = 0;
  info.forEach((curr) => {
    const calcLevel = calcexp(curr.experiences, levelTable);

    if (Math.abs(calcLevel - curr.level) >= 0.01) {
      console.error(calcLevel, curr.level, curr.user.id);
    } else {
      i++;
    }
  });

  console.log(`total: ${info.length} correct: ${i}`);
};
//#endregion
