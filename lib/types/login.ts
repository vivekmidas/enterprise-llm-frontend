export interface RegisterPayload {
  name: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LogoutPayload {
  email: string;
}