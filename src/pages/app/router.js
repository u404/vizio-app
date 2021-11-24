import Vue from "vue"
import Router from "vue-router"

import NavLayout from "./layouts/NavLayout.vue"
import Home from "./views/Home.vue"
import Record from "./views/Settings/Record.vue"
import About from "./views/Settings/About.vue"
import Activity from "./views/Activity.vue"

import Movie from "./views/Movie.vue"
// import Detail from "./views/Detail.vue"
import NewPlayV2 from "./views/NewPlay.v2.vue"
import Buy from "./views/Buy.vue"
import ActivityBuy from "./views/ActivityBuy.vue"

Vue.use(Router)

export const settingsRoutes = [
  {
    path: "", redirect: "record", name: "settings-default", props: { posBaseY: 2 }
  },
  {
    title: "History", path: "record", name: "settings-record", component: Record, props: { posBaseY: 2, posBaseX: 1 }
  },
  {
    title: "About", path: "about", name: "settings-about", component: About, props: { posBaseY: 2, posBaseX: 1 }
  }
  // {
  //   title: "Feedback", path: "feedback", name: "settings-feedback", component: Feedback, props: { posBaseY: 2, posBaseX: 1 }
  // },
  // {
  //   title: "Sign out", path: "signout", name: "settings-signout", component: SignOut, props: { posBaseY: 2, posBaseX: 1 }, display: (store) => !!store.state.bindStatus.status
  // }
]

export const navRoutes = [
  {
    path: "", redirect: "home", name: "default", props: { posBaseY: 1 }
  },
  {
    title: "In Theatres", path: "/home", name: "home", component: Home, props: { posBaseY: 1 }
  },
  // {
  //   title: "Settings",
  //   path: "/settings",
  //   name: "settings",
  //   component: Settings,
  //   children: settingsRoutes,
  //   props: { posBaseY: 1, posBaseX: 1 }
  // }
  {
    title: "History", path: "record", name: "settings-record", component: Record, props: { posBaseY: 1 }
  },
  {
    title: "About", path: "about", name: "settings-about", component: About, props: { posBaseY: 1 }
  }
]

export const routes = [
  {
    path: "/",
    name: "navLayout",
    component: NavLayout,
    children: navRoutes.filter(r => !r.noRoute)
  },
  {
    title: "Movie", path: "/movie/:id", name: "movie", component: Movie, props: true
  },
  {
    title: "详情", path: "/detail/:id", name: "detail", component: NewPlayV2, props: true
  },
  {
    title: "播放", path: "/play/:id", name: "play", component: NewPlayV2, props: true
  },
  {
    title: "购买", path: "/buy/:id", name: "buy", component: Buy, props: true
  },
  {
    title: "活动页", path: "/activity/:id", name: "activity", component: Activity, props: true
  },
  {
    title: "活动购买", path: "/activity/buy/:actId/:id", name: "activity-buy", component: ActivityBuy, props: true
  }
]

const router = new Router({
  routes,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  next()
})

router.afterEach((to, from) => {
  window.__lastRouteTime = window.performance.now()
})

export default router
