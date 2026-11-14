type Result = {
  code: number;
  message: string;
  data: Array<any>;
};

export const getAsyncRoutes = () => {
  // HealthAI routes are compiled from src/router/modules. The template's demo
  // async routes duplicate those pages and assume a different root layout.
  return Promise.resolve<Result>({ code: 0, message: "操作成功", data: [] });
};
