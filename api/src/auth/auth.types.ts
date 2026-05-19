export type AuthUser = {
  sub: string;
  email: string;
};

export type RequestWithUser = Request & {
  user: AuthUser;
};
