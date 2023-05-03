export type CursusUserCache = {
  id: number;
  grade: string;
  level: number;
  blackholedAt?: string;
  beginAt: string;
  endAt?: string;
  cursusId: number;
  user: {
    id: number;
    login: string;
    firstName: string;
    lastName: string;
    url: string;
    displayname: string;
    image: {
      link?: string;
    };
    correctionPoint: number;
    wallet: number;
    alumnizedAt?: string;
  };
};

export const CURSUS_USERS_CACHE_KEY = {
  USER_HASH: 'cursus_users',
} as const;
