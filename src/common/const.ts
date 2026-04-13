import { User } from "@/prisma";

export const Keys = {
  Auth: Symbol("Auth_Key"),
  Roles: Symbol("Roles_Key"),
  User: Symbol("User_Key"),
  Permissions: Symbol("Permissions_KEY"),
  notification: "notification",
  socketio: "socketio",
} as const;

export const CashingNamespace = {
  SocketIo: {
    UserId_By_SocketId: "SocketIo:UserId:socketId",
    SocketId_By_UserId: "SocketIo:SocketId:userId",
  },
  User: {
    UserData_By_UserId: "User:UserData:userId",
  },
} as const;
export type CashingNamespace = ValueOf<{ [K in keyof typeof CashingNamespace]: ValueOf<(typeof CashingNamespace)[K]> }>;
export type CacheKey = `${CashingNamespace}:${string}`;
export type Keys = ValueOf<typeof Keys>;
export const ErrorMessages = {
  EMAIL_ALREADY_EXIST: "Email Already registerd",
  USER_DOES_NOT_EXIST: "User Does not Exist",
  PASSWORD_INCORRECT: "Password does not match",
  ACCESS_TOKEN_NOT_PROVIDED: "Access Token Not Provided",
  INVALIDE_ACCESS_TOKEN: "Invalid Access Token",
  INVALID_TOKEN: "Invalid Token",
} as const;
export const AuthType = {
  BEARER: "Bearer",
  NONE: "None",
} as const;
export type AuthType = ValueOf<typeof AuthType>;
