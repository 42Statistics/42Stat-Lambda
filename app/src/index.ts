import { CampusUserUpdator } from '#lambda/campusUser/campusUser.js';
import { CoalitionsUserUpdator } from '#lambda/coalitionsUser/coalitionsUser.js';
import { CursusUserUpdator } from '#lambda/cursusUser/cursusUser.js';
import { EventUpdator } from '#lambda/event/event.js';
import { EventsUserUpdator } from '#lambda/eventsUser/eventsUser.js';
import { ExamUpdator } from '#lambda/exam/exam.js';
import { LocationUpdator } from '#lambda/location/location.js';
import { LOG_COLLECTION, LambdaMongo } from '#lambda/mongodb/mongodb.js';
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
import { UserUpdator } from '#lambda/user/user.js';
import { assertEnvExist } from '#lambda/util/envCheck.js';
import dotenv from 'dotenv';
import { ActiveUserUpdator } from './activeUser/activeUser.js';

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

export const TIMEZONE = process.env.TIMEZONE;
assertEnvExist(TIMEZONE);

const main = async (): Promise<void> => {
  await initSeine();

  const mongoUrl = process.env.MONGODB_URL;
  assertEnvExist(mongoUrl);

  await using mongo = await LambdaMongo.createInstance(mongoUrl);

  const end = new Date();

  const updators: LambdaUpdator[] = [
    // todo: 현재는 transfer 대응을 위해 무조건 campus user 부터 갱신해야 함.
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
    UserUpdator,
    ActiveUserUpdator,
  ];

  await execUpdators(updators, mongo, end);

  const statUrl = process.env.STAT_APP_URL;
  assertEnvExist(statUrl);

  const minUpdatedAt = await mongo
    .db()
    .collection<{ updatedAt: Date }>(LOG_COLLECTION)
    .find({}, { projection: { updatedAt: 1 } })
    .toArray()
    .then((logs) =>
      logs.reduce((min, { updatedAt }) => {
        return min < updatedAt ? min : updatedAt;
      }, new Date()),
    );

  try {
    const headerName = process.env.STAT_APP_AUTH_HEADER_NAME;
    const headerValue = process.env.STAT_APP_AUTH_HEADER_VALUE;
    assertEnvExist(headerName);
    assertEnvExist(headerValue);

    const response = await fetch(statUrl, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        [headerName]: headerValue,
      },
      body: JSON.stringify({ timestamp: minUpdatedAt.getTime() }),
    });

    if (response.ok) {
      console.log('lambda update success');
    } else {
      console.error('lambda update failed');
    }
  } catch (e) {
    console.error('lambda POST to application failed.', e);
  }
};

export const handler = main;
