import type { CursusUser } from '#lambda/cursusUser/api/cursusUser.api.js';
import {
  type ExperienceUser,
  examExperienceErrorUserIds,
} from '#lambda/experience/api/experience.api.js';
import { LambdaMongo } from '#lambda/mongodb/mongodb.js';
import type { Project } from '#lambda/project/api/project.api.js';
import { ProjectsUser } from '#lambda/projectsUser/api/projectsUser.api.js';
import { PROJECTS_USER_COLLECTION } from '#lambda/projectsUser/projectsUser.js';
import type { ScaleTeam } from '#lambda/scaleTeam/api/scaleTeam.api.js';
import type { PassedTeam } from '#lambda/team/api/team.api.js';
import { TEAM_COLLECTION } from '#lambda/team/team.js';
import { LogAsyncEstimatedTime, UpdateAction } from '#lambda/util/decorator.js';
import { LambdaError } from '#lambda/util/error.js';

export const EXPERIENCE_USER_COLLECTION = 'experience_users';
const LEVEL_COLLECTION = 'levels';
const IS_INTERNSHIP_PROJECT = ({ name }: Pick<Project, 'name'>): boolean => {
  return name.toLowerCase().startsWith('internship');
};

type LevelTableElem = {
  lvl: number;
  xp: number;
};

type UpdatedProjectsUser = Omit<ProjectsUser, 'project' | 'markedAt'> & {
  project: Project;
  markedAt: Date;
  cursusUser?: CursusUser;
  currTeam: PassedTeam;
  experienceUsers: ExperienceUser[];
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
  static async update(mongo: LambdaMongo): Promise<void> {
    await ExperienceUpdator.updateProjectsUserUpdated(mongo);
    await testLevelCalculation(mongo);
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
    mongo: LambdaMongo,
  ): Promise<void> {
    const projectsUserUpdated = await mongo.getCollectionUpdatedAt(
      PROJECTS_USER_COLLECTION,
    );

    const teamUpdated = await mongo.getCollectionUpdatedAt(TEAM_COLLECTION);

    if (teamUpdated < projectsUserUpdated) {
      console.log('team update fail occurred before.');
      return;
    }

    const projectsUsersUpdated = await findProjectsUserUpdated(mongo);
    if (!projectsUsersUpdated.length) {
      return;
    }

    const levelTable = await mongo
      .db()
      .collection<LevelTableElem>(LEVEL_COLLECTION)
      .find()
      .sort({ lvl: 1 })
      .toArray();

    const newExperiencesUsers = projectsUsersUpdated.reduce(
      (acc: ExperienceUser[], projectsUser) => {
        try {
          assertsDataConsistency(projectsUser);

          const newExperience = calculateNewExperience({
            projectsUser,
            levelTable,
          });

          if (!newExperience) {
            return acc;
          }

          acc.push({
            userId: projectsUser.user.id,
            cursusId: projectsUser.cursusIds[0],
            createdAt: projectsUser.markedAt,
            experience: newExperience,
            project: projectsUser.project,
          });

          return acc;
        } catch (e) {
          console.error(projectsUser.user.id);
          throw e;
        }
      },
      [],
    );

    if (newExperiencesUsers.length === 0) {
      return;
    }

    const end = newExperiencesUsers.reduce(
      (prev, { createdAt }) => (prev > createdAt ? prev : createdAt),
      new Date(0),
    );

    await mongo
      .db()
      .collection(EXPERIENCE_USER_COLLECTION)
      .insertMany(newExperiencesUsers);

    await mongo.setCollectionUpdatedAt(EXPERIENCE_USER_COLLECTION, end);
  }
}

const findProjectsUserUpdated = async (
  mongo: LambdaMongo,
): Promise<UpdatedProjectsUser[]> => {
  const start = await mongo.getCollectionUpdatedAt(EXPERIENCE_USER_COLLECTION);

  return await mongo
    .db()
    .collection<ProjectsUser>(PROJECTS_USER_COLLECTION)
    .aggregate<UpdatedProjectsUser>(
      //#region aggregation pipeline
      [
        {
          $match: {
            // todo: $gte
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
          $match: {
            'cursusUser.user.alumni?': false,
          },
        },
        {
          $lookup: {
            from: EXPERIENCE_USER_COLLECTION,
            localField: 'user.id',
            foreignField: 'userId',
            as: 'experienceUsers',
          },
        },
        {
          $lookup: {
            from: TEAM_COLLECTION,
            localField: 'currTeam.id',
            foreignField: 'id',
            as: 'currTeam',
          },
        },
        {
          $addFields: {
            currTeam: { $first: '$currTeam' },
          },
        },
      ],
      //#endregion
    )
    .toArray();
};

function assertsDataConsistency(
  projectsUser: UpdatedProjectsUser,
): asserts projectsUser is Required<UpdatedProjectsUser> {
  if (!projectsUser.cursusUser) {
    throw new LambdaError('data consistency', projectsUser);
  }
}

const calculateNewExperience = ({
  projectsUser,
  levelTable,
}: {
  projectsUser: Required<UpdatedProjectsUser>;
  levelTable: LevelTableElem[];
}): number => {
  if (IS_INTERNSHIP_PROJECT(projectsUser.project)) {
    return calculateExperienceByLevel({ projectsUser, levelTable });
  }

  return calculateExperienceByMark({ projectsUser, levelTable });
};

const calculateExperienceByMark = ({
  projectsUser,
  levelTable,
}: {
  projectsUser: Required<UpdatedProjectsUser>;
  levelTable: LevelTableElem[];
}): number => {
  const { projectPrevExperience, totalPrevExperience } =
    calculatePrevExperience(projectsUser);

  const currMark = calculateMark(projectsUser);
  const { expWithoutCoalition, expWithCoalition } =
    calculateCoalitionExperience({
      mark: currMark,
      project: projectsUser.project,
      projectPrevExperience,
    });

  const levelWithoutCoalition = calculateLevel(
    totalPrevExperience + expWithoutCoalition,
    levelTable,
  );

  const levelWithCoalition = calculateLevel(
    totalPrevExperience + expWithCoalition,
    levelTable,
  );

  const experience =
    Math.abs(levelWithCoalition - projectsUser.cursusUser.level) <
    Math.abs(levelWithoutCoalition - projectsUser.cursusUser.level)
      ? expWithCoalition
      : expWithoutCoalition;

  return experience;
};

/**
 *
 * @description
 * Internship 과제 같은 경우, final mark 기반으로 경험치가 지급되는 것이 아닌,
 * Internship 근무 시간에 비례해서 지급이 되기 때문에, 변경된 레벨을 통해 계산할 수 밖에 없습니다.
 */
const calculateExperienceByLevel = ({
  projectsUser,
  levelTable,
}: {
  projectsUser: Required<UpdatedProjectsUser>;
  levelTable: LevelTableElem[];
}): number => {
  const { totalPrevExperience } = calculatePrevExperience(projectsUser);

  const targetLevel = projectsUser.cursusUser.level;
  const targetLevelInt = Math.floor(targetLevel);
  const targetLevelFloat = targetLevel - targetLevelInt;

  const upper = levelTable.find((levelElem) => levelElem.lvl > targetLevel);
  const lower = levelTable.find(
    (levelElem) => levelElem.lvl === targetLevelInt,
  );

  assertsLevelFound(upper);
  assertsLevelFound(lower);

  const targetExperience =
    lower.xp + Math.floor((upper.xp - lower.xp) * targetLevelFloat);

  // Internship 과제는 시간에 비례해서 경험치가 지급되기 때문에, 끝이 0으로 떨어지게 되는 상황이라 추측하는 중 입니다.
  return Math.round((targetExperience - totalPrevExperience) / 10) * 10;
};

const calculatePrevExperience = (
  projectsUser: UpdatedProjectsUser,
): { projectPrevExperience: number; totalPrevExperience: number } => {
  const projectPrevExperience = projectsUser.experienceUsers
    .filter((experience) => experience.project.id === projectsUser.project.id)
    .reduce((expSum, { experience }) => {
      return expSum + experience;
    }, 0);

  const totalPrevExperience = projectsUser.experienceUsers.reduce(
    (experienceSum, { experience }) => experienceSum + experience,
    0,
  );

  return {
    projectPrevExperience,
    totalPrevExperience,
  };
};

const calculateMark = (projectsUser: UpdatedProjectsUser): number => {
  const scaleTeams = projectsUser.currTeam.scaleTeams.filter(
    (
      scaleTeam,
    ): scaleTeam is Omit<ScaleTeam, 'finalMark'> & {
      finalMark: number;
    } => scaleTeam.finalMark !== null,
  );

  if (!scaleTeams.length) {
    return projectsUser.currTeam.finalMark;
  }

  const scaleTeamMark =
    scaleTeams.reduce((mark, scaleTeam) => mark + scaleTeam.finalMark, 0) /
    scaleTeams.length;

  const teamUploadMark = projectsUser.currTeam.teamsUploads[0]?.finalMark;

  return (
    Math.floor(
      (teamUploadMark ? (scaleTeamMark + teamUploadMark) / 2 : scaleTeamMark) *
        100,
    ) / 100
  );
};

/**
 *
 * @description
 * 점수와 프로젝트에 기반하여, 얻는 예상 경험치를 코알리숑 보너스가 있을 때와 없을 때로 나누어 반환합니다.
 */
const calculateCoalitionExperience = ({
  mark,
  project,
  projectPrevExperience,
}: {
  mark: number;
  project: Project;
  projectPrevExperience: number;
}): { expWithoutCoalition: number; expWithCoalition: number } => {
  const expWithoutCoalition = Math.max(
    Math.floor((project.difficulty ?? 0) * (mark / 100.0)) -
      projectPrevExperience,
    0,
  );

  const expWithCoalition = Math.max(
    Math.floor((project.difficulty ?? 0) * (mark / 100.0) * 1.042) -
      projectPrevExperience,
    0,
  );

  return { expWithoutCoalition, expWithCoalition };
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

  return Math.floor((lowerLevel + levelFloat) * 100 + Number.EPSILON) / 100;
};

function assertsLevelFound(
  levelElem: LevelTableElem | undefined,
): asserts levelElem is LevelTableElem {
  if (!levelElem) {
    throw new LambdaError('wrong calc logic');
  }
}

//#region 테스트 함수 입니다.
const testLevelCalculation = async (mongo: LambdaMongo): Promise<void> => {
  const info = await mongo
    .db()
    .collection('cursus_users')
    .aggregate<{
      user: {
        id: number;
      };
      level: number;
      experiences: number;
    }>([
      {
        $lookup: {
          from: EXPERIENCE_USER_COLLECTION,
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

  const levelTable = await mongo
    .db()
    .collection<LevelTableElem>('levels')
    .find()
    .sort({ lvl: 1 })
    .toArray();

  const successCount = info.reduce((prevSuccessCount, curr) => {
    const calcLevel = calculateLevel(curr.experiences, levelTable);

    if (
      Math.abs(calcLevel - curr.level) >= 0.01 &&
      !examExperienceErrorUserIds.find((uid) => uid === curr.user.id)
    ) {
      console.error(calcLevel, curr.level, curr.user.id);
      return prevSuccessCount;
    }

    return prevSuccessCount + 1;
  }, 0);

  console.log(`total: ${info.length} correct: ${successCount}`);
};
//#endregion
