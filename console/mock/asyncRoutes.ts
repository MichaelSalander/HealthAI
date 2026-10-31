// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { system, monitor, permission, frame, tabs } from "@/router/enums";

const healthAiRouter = {
  path: "/healthai",
  meta: {
    icon: "ri:heart-pulse-line",
    title: "menus.healthAi",
    rank: 1
  },
  children: [
    {
      path: "/healthai/overview",
      name: "HealthAiOverview",
      meta: { icon: "ri:dashboard-line", title: "menus.healthAiOverview", roles: ["admin", "common"] }
    },
    {
      path: "/healthai/clients",
      name: "HealthAiClients",
      meta: { icon: "ri:user-heart-line", title: "menus.healthAiClients", roles: ["admin", "common"] }
    },
    {
      path: "/healthai/content",
      name: "HealthAiContent",
      meta: { icon: "ri:layout-grid-line", title: "menus.healthAiContent", roles: ["admin"] }
    },
    {
      path: "/healthai/services",
      name: "HealthAiServices",
      meta: { icon: "ri:price-tag-3-line", title: "menus.healthAiServices", roles: ["admin"] }
    },
    {
      path: "/healthai/users",
      name: "HealthAiUsers",
      meta: { icon: "ri:user-settings-line", title: "menus.healthAiUsers", roles: ["admin"] }
    },
    {
      path: "/healthai/consultants",
      name: "HealthAiConsultants",
      meta: { icon: "ri:admin-line", title: "menus.healthAiConsultants", roles: ["admin"] }
    },
    {
      path: "/healthai/orders",
      name: "HealthAiOrders",
      meta: { icon: "ri:shopping-bag-3-line", title: "menus.healthAiOrders", roles: ["admin"] }
    },
    {
      path: "/healthai/system",
      name: "HealthAiSystem",
      meta: { icon: "ri:shield-check-line", title: "menus.healthAiSystem", roles: ["admin"] }
    },
    {
      path: "/healthai/consultations",
      name: "HealthAiConsultations",
      meta: { icon: "ri:customer-service-2-line", title: "待諮詢與派單", roles: ["admin"] }
    },
    {
      path: "/healthai/centers",
      name: "HealthAiCenters",
      meta: { icon: "ri:hospital-line", title: "指定體檢中心", roles: ["admin"] }
    },
    {
      path: "/healthai/education",
      name: "HealthAiEducation",
      meta: { icon: "ri:book-open-line", title: "衛教內容", roles: ["admin"] }
    }
  ]
};

const consultantRouter = {
  path: "/consultant",
  meta: {
    icon: "ri:stethoscope-line",
    title: "menus.consultantWorkspace",
    rank: 2
  },
  children: [
    {
      path: "/consultant/dashboard",
      name: "ConsultantDashboard",
      meta: { icon: "ri:dashboard-2-line", title: "menus.consultantDashboard", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/clients",
      name: "ConsultantClients",
      meta: { icon: "ri:team-line", title: "menus.consultantClients", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/client-health",
      name: "ConsultantClientHealth",
      meta: { icon: "ri:heart-pulse-line", title: "menus.consultantClientHealth", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/insights",
      name: "ConsultantInsights",
      meta: { icon: "ri:sparkling-2-line", title: "menus.consultantInsights", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/consultation",
      name: "ConsultantConsultation",
      meta: { icon: "ri:chat-1-line", title: "menus.consultantConsultation", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/profile",
      name: "ConsultantProfile",
      meta: { icon: "ri:id-card-line", title: "menus.consultantProfile", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/schedule",
      name: "ConsultantSchedule",
      meta: { icon: "ri:calendar-schedule-line", title: "預約與服務狀態", roles: ["admin", "consultant"] }
    },
    {
      path: "/consultant/notifications",
      name: "ConsultantNotifications",
      meta: { icon: "ri:notification-3-line", title: "提醒通知", roles: ["admin", "consultant"] }
    }
  ]
};

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */

const systemManagementRouter = {
  path: "/system",
  meta: {
    icon: "ri:settings-3-line",
    title: "menus.pureSysManagement",
    rank: system
  },
  children: [
    {
      path: "/system/user/index",
      name: "SystemUser",
      meta: {
        icon: "ri:admin-line",
        title: "menus.pureUser",
        roles: ["admin"]
      }
    },
    {
      path: "/system/role/index",
      name: "SystemRole",
      meta: {
        icon: "ri:admin-fill",
        title: "menus.pureRole",
        roles: ["admin"]
      }
    },
    {
      path: "/system/menu/index",
      name: "SystemMenu",
      meta: {
        icon: "ep:menu",
        title: "menus.pureSystemMenu",
        roles: ["admin"]
      }
    },
    {
      path: "/system/dept/index",
      name: "SystemDept",
      meta: {
        icon: "ri:git-branch-line",
        title: "menus.pureDept",
        roles: ["admin"]
      }
    }
  ]
};

const systemMonitorRouter = {
  path: "/monitor",
  meta: {
    icon: "ep:monitor",
    title: "menus.pureSysMonitor",
    rank: monitor
  },
  children: [
    {
      path: "/monitor/online-user",
      component: "monitor/online/index",
      name: "OnlineUser",
      meta: {
        icon: "ri:user-voice-line",
        title: "menus.pureOnlineUser",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/login-logs",
      component: "monitor/logs/login/index",
      name: "LoginLog",
      meta: {
        icon: "ri:window-line",
        title: "menus.pureLoginLog",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/operation-logs",
      component: "monitor/logs/operation/index",
      name: "OperationLog",
      meta: {
        icon: "ri:history-fill",
        title: "menus.pureOperationLog",
        roles: ["admin"]
      }
    },
    {
      path: "/monitor/system-logs",
      component: "monitor/logs/system/index",
      name: "SystemLog",
      meta: {
        icon: "ri:file-search-line",
        title: "menus.pureSystemLog",
        roles: ["admin"]
      }
    }
  ]
};

const permissionRouter = {
  path: "/permission",
  meta: {
    title: "menus.purePermission",
    icon: "ep:lollipop",
    rank: permission
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "menus.purePermissionPage",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "menus.purePermissionButton",
        roles: ["admin", "common"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "menus.purePermissionButtonRouter",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "menus.purePermissionButtonLogin"
          }
        }
      ]
    }
  ]
};

const frameRouter = {
  path: "/iframe",
  meta: {
    icon: "ri:links-fill",
    title: "menus.pureExternalPage",
    rank: frame
  },
  children: [
    {
      path: "/iframe/embedded",
      meta: {
        title: "menus.pureEmbeddedDoc"
      },
      children: [
        {
          path: "/iframe/colorhunt",
          name: "FrameColorHunt",
          meta: {
            title: "menus.pureColorHuntDoc",
            frameSrc: "https://colorhunt.co/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/uigradients",
          name: "FrameUiGradients",
          meta: {
            title: "menus.pureUiGradients",
            frameSrc: "https://uigradients.com/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/ep",
          name: "FrameEp",
          meta: {
            title: "menus.pureEpDoc",
            frameSrc: "https://element-plus.org/zh-CN/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/tailwindcss",
          name: "FrameTailwindcss",
          meta: {
            title: "menus.pureTailwindcssDoc",
            frameSrc: "https://tailwindcss.com/docs/installation",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/vue3",
          name: "FrameVue",
          meta: {
            title: "menus.pureVueDoc",
            frameSrc: "https://cn.vuejs.org/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/vite",
          name: "FrameVite",
          meta: {
            title: "menus.pureViteDoc",
            frameSrc: "https://cn.vitejs.dev/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/pinia",
          name: "FramePinia",
          meta: {
            title: "menus.purePiniaDoc",
            frameSrc: "https://pinia.vuejs.org/zh/index.html",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        },
        {
          path: "/iframe/vue-router",
          name: "FrameRouter",
          meta: {
            title: "menus.pureRouterDoc",
            frameSrc: "https://router.vuejs.org/zh/",
            keepAlive: true,
            roles: ["admin", "common"]
          }
        }
      ]
    },
    {
      path: "/iframe/external",
      meta: {
        title: "menus.pureExternalDoc"
      },
      children: [
        {
          path: "/external",
          name: "https://pure-admin.cn/",
          meta: {
            title: "menus.pureExternalLink",
            roles: ["admin", "common"]
          }
        },
        {
          path: "/pureUtilsLink",
          name: "https://pure-admin-utils.netlify.app/",
          meta: {
            title: "menus.pureUtilsLink",
            roles: ["admin", "common"]
          }
        }
      ]
    }
  ]
};

const tabsRouter = {
  path: "/tabs",
  meta: {
    icon: "ri:bookmark-2-line",
    title: "menus.pureTabs",
    rank: tabs
  },
  children: [
    {
      path: "/tabs/index",
      name: "Tabs",
      meta: {
        title: "menus.pureTabs",
        roles: ["admin", "common"]
      }
    },
    // query 传参模式
    {
      path: "/tabs/query-detail",
      name: "TabQueryDetail",
      meta: {
        // 不在menu菜单中显示
        showLink: false,
        activePath: "/tabs/index",
        roles: ["admin", "common"]
      }
    },
    // params 传参模式
    {
      path: "/tabs/params-detail/:id",
      component: "params-detail",
      name: "TabParamsDetail",
      meta: {
        // 不在menu菜单中显示
        showLink: false,
        activePath: "/tabs/index",
        roles: ["admin", "common"]
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        code: 0,
        message: "操作成功",
        data: [
          healthAiRouter,
          consultantRouter,
          systemManagementRouter,
          systemMonitorRouter,
          permissionRouter,
          frameRouter,
          tabsRouter
        ]
      };
    }
  }
]);
