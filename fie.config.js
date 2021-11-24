"use strict"

module.exports = {
  toolkit: "fie-toolkit-vue",

  toolkitConfig: {
    overseas: true,

    group: "fe-international",

    /**
     * publishPages配置页面发布（必须）
     * outputPath {string} 对应dist目录 例如：index.html
     * publicPath {string} 对应根域名 例如：test/index.html
     * description {string} 页面描述
     */
    publishPages: [
      // {
      //   outputPath: "player-demo.html",
      //   publicPath: "vizio-app/player-demo.html",
      //   description: ""
      // },
      // {
      //   outputPath: "dashjs-demo.html",
      //   publicPath: "vizio-app/dashjs-demo.html",
      //   description: ""
      // },
      // {
      //   outputPath: "videojs-demo.html",
      //   publicPath: "vizio-app/videojs-demo.html",
      //   description: ""
      // },
      // {
      //   outputPath: "ad-test.html",
      //   publicPath: "vizio-app/ad-test.html",
      //   description: ""
      // },
      {
        outputPath: "app.html",
        publicPath: "vizio-app/app.html",
        description: ""
      },
      {
        outputPath: "app.html",
        publicPath: "vizio-app/beta.html",
        description: ""
      }
      // {
      //   outputPath: "app.html",
      //   publicPath: "vizio-app/alpha.html",
      //   description: ""
      // },
      // {
      //   outputPath: "tts-test.html",
      //   publicPath: "vizio-app/tts-test.html",
      //   description: ""
      // }
    ]
  },

  configureWebpack: {
    externals: {
      vue: "Vue",
      vuex: "Vuex",
      shaka: "shaka"
    }
  },

  css: {
    loaderOptions: {
      sass: {
        data: `@import "src/common/style/mixins.scss";`
      }
    },
    modules: false
  },

  // 多页开发使用 pages选项
  pages: {
    // "player-demo": {
    //   entry: "src/pages/player-demo/main.js",
    //   template: "src/pages/player-demo/index.html",
    //   filename: "player-demo.html"
    // },
    // "dashjs-demo": {
    //   entry: "src/pages/dashjs-demo/main.js",
    //   template: "src/pages/dashjs-demo/index.html",
    //   filename: "dashjs-demo.html"
    // },
    // "videojs-demo": {
    //   entry: "src/pages/videojs-demo/main.js",
    //   template: "src/pages/videojs-demo/index.html",
    //   filename: "videojs-demo.html"
    // },
    // "ad-test": {
    //   entry: "src/pages/ad-test/main.js",
    //   template: "src/pages/ad-test/index.html",
    //   filename: "ad-test.html"
    // },
    "app": {
      entry: "src/pages/app/main.js",
      template: "src/pages/app/index.html",
      filename: "app.html"
    }
    // "tts-test": {
    //   entry: "src/pages/app-tts-test/main.js",
    //   template: "src/pages/app-tts-test/index.html",
    //   filename: "tts-test.html"
    // }
  },

  devServer: {
    proxy: {
      "/": {
        ws: false,
        target: "https://aws-api.smartcinemausa.com/",
        changOrigin: true
      }
    }
  }
}
