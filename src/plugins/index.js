import filters from "./filters"
import directives from "./directives"
import reporter from "@sc/lib-amplitude"
import confirm from "@/components/Confirm/function"

const install = (Vue, options) => {
  Vue.prototype.$bus = new Vue()
  Vue.prototype.$confirm = confirm
  Vue.use(filters)
  Vue.use(directives)
  Vue.prototype.$reporter = reporter
}

export default {
  install
}
