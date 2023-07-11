import { CampusUserUpdator } from '#lambda/campusUser/campusUser.js';
import { CoalitionsUserUpdator } from '#lambda/coalitionsUser/coalitionsUser.js';
import { CursusUserUpdator } from '#lambda/cursusUser/cursusUser.js';
import { EventUpdator } from '#lambda/event/event.js';
import { EventsUserUpdator } from '#lambda/eventsUser/eventsUser.js';
import { ExamUpdator } from '#lambda/exam/exam.js';
import { LocationUpdator } from '#lambda/location/location.js';
import { LambdaMongo, withMongo } from '#lambda/mongodb/mongodb.js';
import { ProjectUpdator } from '#lambda/project/project.js';
import { ProjectSessionUpdator } from '#lambda/projectSession/projectSession.js';
import { ProjectSessionsSkillUpdator } from '#lambda/projectSessionsSkill/projectSessionsSkill.js';
import { ProjectsUserUpdator } from '#lambda/projectsUser/projectsUser.js';
import { QuestsUserUpdator } from '#lambda/questsUser/questsUser.js';
import { initSeine } from '#lambda/request/initSeine.js';
import { ScaleTeamUpdator } from '#lambda/scaleTeam/scaleTeam.js';
import { ScoreUpdator } from '#lambda/score/score.js';
import { SkillUpdator } from '#lambda/skill/skill.js';
import { TeamUpdator } from '#lambda/team/team.js';
import { TitleUpdator } from '#lambda/title/title.js';
import { TitlesUserUpdator } from '#lambda/titlesUser/titlesUser.js';
import { assertEnvExist } from '#lambda/util/envCheck.js';
import dotenv from 'dotenv';

dotenv.config();

type LambdaUpdator = {
  update: (mongo: LambdaMongo, end: Date) => Promise<void>;
};

type LambdaDeletor = {
  pruneDeleted: (mongo: LambdaMongo) => Promise<void>;
};

const execUpdators = async (
  updators: LambdaUpdator[],
  mongo: LambdaMongo,
  end: Date,
): Promise<void> => {
  for (const updator of updators) {
    await updator.update(mongo, end);
  }
};

const execDeletors = async (
  deletors: LambdaDeletor[],
  mongo: LambdaMongo,
): Promise<void> => {
  for (const deletor of deletors) {
    await deletor.pruneDeleted(mongo);
  }
};

const main = async (): Promise<void> => {
  await initSeine();

  const mongoUrl = process.env.MONGODB_URL;
  assertEnvExist(mongoUrl);

  await withMongo(mongoUrl, async (mongo) => {
    const end = new Date();

    const defaultUpdators: LambdaUpdator[] = [
      CampusUserUpdator,
      ProjectsUserUpdator,
      TeamUpdator,
      CursusUserUpdator,
      ExamUpdator,
      LocationUpdator,
      ScoreUpdator,
      QuestsUserUpdator,
      EventUpdator,
      EventsUserUpdator,
      ScaleTeamUpdator,
      ProjectUpdator,
      ProjectSessionUpdator,
      ProjectSessionsSkillUpdator,
      CoalitionsUserUpdator,
    ];

    await execUpdators(defaultUpdators, mongo, end);

    {
      const conditionalUpdators: LambdaUpdator[] = [
        TitleUpdator,
        TitlesUserUpdator,
        SkillUpdator,
      ];

      const miniutes = new Date().getUTCMinutes();

      if (Math.floor(miniutes / 10) === 0) {
        await execUpdators(conditionalUpdators, mongo, end);
      }

      const conditionalDeletors: LambdaDeletor[] = [TeamUpdator];

      if (Math.floor(miniutes / 10) === 1) {
        await execDeletors(conditionalDeletors, mongo);
      }
    }
  });
};

export const handler = main;
