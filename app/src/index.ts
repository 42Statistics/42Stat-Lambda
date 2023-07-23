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

const execUpdators = async (
  updators: LambdaUpdator[],
  mongo: LambdaMongo,
  end: Date,
): Promise<void> => {
  for (const updator of updators) {
    await updator.update(mongo, end);
  }
};

const main = async (): Promise<void> => {
  await initSeine();

  const mongoUrl = process.env.MONGODB_URL;
  assertEnvExist(mongoUrl);

  await withMongo(mongoUrl, async (mongo) => {
    const end = new Date();

    const updators: LambdaUpdator[] = [
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
      TitleUpdator,
      TitlesUserUpdator,
      SkillUpdator,
    ];

    await execUpdators(updators, mongo, end);

    const statUrl = process.env.STAT_APP_URL;
    assertEnvExist(statUrl);

    const response = await fetch(statUrl, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestamp: end.getTime() }),
    });

    if (response.ok) {
      console.log('lambda update success');
    } else {
      console.error('lambda update failed');
    }
  });
};

export const handler = main;
