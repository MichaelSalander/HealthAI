import { http } from "@/utils/http";

const healthAiApiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api/v1").replace(/\/$/, "");

export type UserResult = {
  code: number;
  message: string;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  code: number;
  message: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type UserInfo = {
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 联系电话 */
  phone: string;
  /** 简介 */
  description: string;
};

export type UserInfoResult = {
  code: number;
  message: string;
  data: UserInfo;
};

type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

/** 登录 */
export const getLogin = async (data?: object): Promise<UserResult> => {
  const input = (data || {}) as { username?: string; password?: string };
  const response = await fetch(`${healthAiApiBase}/auth/operator-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin", username: input.username || "", password: input.password || "" })
  });
  const payload = (await response.json()) as { data?: { token: string; id: string; name: string; role: string; expiresIn: number }; message?: string };
  if (!response.ok || !payload.data) throw new Error(payload.message || "登录失败");
  const expires = new Date(Date.now() + payload.data.expiresIn * 1000);
  return {
    code: 0,
    message: "登录成功",
    data: {
      avatar: "",
      username: payload.data.id,
      nickname: payload.data.name,
      roles: [payload.data.role],
      permissions: ["*"],
      accessToken: payload.data.token,
      refreshToken: "",
      expires
    }
  };
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};

/** 账户设置-个人信息 */
export const getMine = (data?: object) => {
  return http.request<UserInfoResult>("get", "/mine", { data });
};

/** 账户设置-个人安全日志 */
export const getMineLogs = (data?: object) => {
  return http.request<ResultTable>("get", "/mine-logs", { data });
};
