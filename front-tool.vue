<!--前端工具栏-->
<style scoped>
.c-mask-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}
.c-mask-box .mask {
  position: fixed;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background-color: #000000;
}
.c-mask-box .mask-white {
  background-color: #ffffff;
}
.c-mask-box .content-box {
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  align-items: center;
  justify-content: center;
}
.c-front-tool {
  display: inline-block;
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
}
.c-front-tool .control-box {
  padding: 20px 0;
  width: 450px;
  height: 90%;
  border-radius: 4px;
  background-color: #eeeeee;
}
.c-front-tool .control-box li {
  margin: 0 auto 10px;
  position: relative;
  width: 300px;
  padding: 14px 0;
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  border-radius: 4px;
  background-color: #3D8AC7;
}
.c-front-tool .control-box li:nth-last-child(1) {
  background-color: #DC5350;
}
.c-front-tool .control-box li:nth-last-child(2) {
  background-color: #F66F2C;
}
.c-front-tool .control-box li:nth-last-child(1) {
  background-color: #DC5350;
}
.c-front-tool .btn-entrance {
  position: relative;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 20px;
  font-weight: bold;
  color: white;
  opacity: 0.7;
  background-color: #3D8AC7;
}
.c-front-tool .btn-entrance i {
  position: absolute;
  top: -8px;
  right: -8px;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  border: 1px solid lightgray;
  background-color: #ffffff;
  background-repeat: round;
  background-image: url(http://www.luckly-mjw.cn/baseSource/icon-cancel.png);
}
.c-tips {
  position: fixed;
  padding: 0 14px;
  top: -50px;
  left: 50%;
  height: 40px;
  color: #69C6D2;
  font-size: 20px;
  line-height: 38px;
  border-radius: 2px;
  display: inline-block;
  transition: 0.5s all;
  transform: translate(-50%);
  background-color: #275E71;
  border: 2px solid #57C4CE;
}
.c-tips--show {
  top: 10px;
}
</style>

<template>
  <section class="c-front-tool" v-show="!isClose" v-if="runtimeEnv!=='prod'">
    <section class="c-mask-box" @dragstart="false" v-if="showBox">
      <div class="mask"></div>
      <div class="content-box" @click.self="showBox=false">
        <div class="control-box">
          <ul>
            <li @click="reportDate"> 数据上报 </li>
            <li @click="clearToken"> 清除token，重新登录 </li>
            <li @click="clearStorage"> 清除所有缓存数据 </li>
            <li v-for="(item, index) in menu" @click="item.callback" :key="index"> {{item.name}} </li>
            <li @click="showBox=false"> 关闭弹窗 </li>
            <li @click="isClose=true"> 关闭工具 </li>
          </ul>
        </div>
      </div>
    </section>
    <div class="c-tips" :class="{'c-tips--show':showTips}">{{tips}}</div>
    <div class="btn-entrance" @click="showBox=true">{{runtimeEnv | runtimeName}}环境</div>
  </section>
</template>

<script>
/* eslint-disable */
import './av'

export default {
  props: {
    menu: Array,
  },
  data() {
    return {
      tips: '', // 提示文案
      tipsTimeout: -1, // 提示文案重置计时器
      browserType: '', // 浏览器类型
      runtimeEnv: 'local', // 当前运行环境
      ajaxList: [], // ajax请求数组
      globalData: {}, // 自定义全局数据，每个上报的数据都有，用于保存用户名等固定信息
      customData: {}, // 自定义数据
      showTips: false, // 是否显示控制面板
      showBox: false, // 是否显示控制面板
      isClose: false, // 是否关闭工具
    }
  },

  filters: {
    runtimeName(value) {
      return {
        local: '本地',
        dev: '开发',
        test: '测试',
        pre: '预发布',
        prod: '正式',
      }[value]
    },
  },

  watch: {
    // 刷新组件，即在路由变更时，清空记录内容
    $route() {
      this.ajaxList = []
      this.clearCustomData() // 清空自定义数据
    },

    tips(newValue) {
      clearTimeout(this.tipsTimeout)
      if (newValue) {
        this.showTips = true
        this.tipsTimeout = setTimeout(() => {
          this.showTips = false
        }, 2000)
      }
    },
  },

  created() {
    this.runtimeEnv = this.getRuntimeEnv()
    if (this.runtimeEnv !== 'prod') {
      this.init()
    } else { // 正式环境，将全局函数置空
      this.$root.__proto__.$addCustomData =
        this.$root.__proto__.$clearCustomData =
          this.$root.__proto__.$addGlobalData =
            this.$root.__proto__.$clearGlobalData =
              window.$collectData = () => {}
    }
  },

  methods: {

    // 初始化，重写AJAX，往全局添加函数
    init() {
      this.resetAjax()
      this.browserType = this.getBrowserType()
      this.$root.__proto__.$addCustomData = this.addCustomData.bind(this)
      this.$root.__proto__.$clearCustomData = this.clearCustomData.bind(this)
      this.$root.__proto__.$addGlobalData = this.addGlobalData.bind(this)
      this.$root.__proto__.$clearGlobalData = this.clearGlobalData.bind(this)
      window.$collectData = this.reportDate.bind(this)
      if (!AV._config.applicationId) {
        AV.init({
          appId: '',
          appKey: '',
        })
      }
    },

    // 解析参数
    getParams(url, key) {
      let params = {}
      url = decodeURIComponent(url.replace(/%/g, '%25'))
      url.replace(/[?|&](\w+)=([^&^?]*)/g, (matchStr, $1, $2) => {
        params[$1] = $2
      })
      return key ? params[key] : params
    },

    // 添加全局数据，在每个上报的数据中都有
    addGlobalData(data) {
      this.globalData = Object.assign(this.globalData, data)
    },

    // 添加全局数据，在每个上报的数据中都有
    clearGlobalData() {
      this.globalData = {}
    },

    // 添加自定义数据
    addCustomData(data) {
      this.customData = Object.assign(this.customData, data)
    },

    // 添加自定义数据
    clearCustomData() {
      this.customData = {}
    },

    // 重写AJAX
    resetAjax() {
      if (window._hadResetAjax) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
        return
      }
      window._hadResetAjax = true
      let originXHR = window.XMLHttpRequest
      let originOpen = originXHR.prototype.open
      let originSend = originXHR.prototype.send
      let originSetRequestHeader = originXHR.prototype.setRequestHeader

      // 重置事件
      window.XMLHttpRequest = () => {
        let ajaxData = {} // 整个ajax数据，收集数据时用
        let realXHR = new originXHR()

        // 重置操作函数，获取请求数据
        realXHR.open = (method, url, asyn) => {
          ajaxData.request = {
            method: method,
            url: url.split('?')[0],
            data: this.getParams(url),
            header: {},
          }
          originOpen.call(realXHR, method, url, asyn)
        }

        // 重置设置请求头的函数
        realXHR.setRequestHeader = (header, value) => {
          ajaxData.request.header[header] = value
          originSetRequestHeader.call(realXHR, header, value)
        }

        // 重置操作函数，获取请求数据
        realXHR.send = (postData) => {
          ajaxData.request.timeout = realXHR.timeout
          ajaxData.request.responseType = realXHR.responseType
          if (postData) {
            ajaxData.request.data = typeof postData === 'string' ? this.getParams(`?${postData}`) : postData
          }
          try { // 防止timeout等报错，造成程序阻塞
            originSend.call(realXHR, postData)
          } catch (e) {
            console.log(e)
          }
        }

        // 监听加载完成，获取回复的报文
        realXHR.addEventListener('loadend', () => {
          ajaxData.response = realXHR.response
          this.ajaxList.push(ajaxData)
        }, false)
        return realXHR
      }
    },

    // 清除缓存
    clearStorage() {
      sessionStorage.clear()
      localStorage.clear()
      this.tips = '数据清除成功，即将重新加载'
      setTimeout(() => location.reload(), 1500)
    },

    // 清除登录信息
    clearToken() {
      this.isClose = true
      localStorage.removeItem('token')
      this.tips = 'token清除成功，即将重新加载'
      setTimeout(() => location.reload(), 1500)
    },

    // 上报数据
    reportDate() {
      const bugClass = AV.Object.extend('bug')
      let bug = new bugClass()
      bug.set('env', this.runtimeEnv) // 当前环境
      bug.set('hostEnv', this.browserType) // 运行的浏览器
      bug.set('pageURL', location.href) // 页面路径
      bug.set('useragent', navigator.userAgent) // 浏览器信息
      bug.set('ajax', this.ajaxList) // 接口信息
      bug.set('custom', Object.assign({}, this.globalData, this.customData)) // 自定义数据
      bug.save().then((res) => {
        this.showBox = false
        this.tips = `数据上报成功，信息ID为：${res.id}`
      }, function (error) {
        alert(JSON.stringify(error));
      });
    },

    // 获取运行环境
    getRuntimeEnv() {
      let envObj = {
        dev: '',
        test: '',
        pre: '',
        prod: '',
      }
      for (let key in envObj) {
        if (location.href.indexOf(envObj[key]) !== -1) {
          return key
        }
      }
      return 'local'
    },

    getBrowserType() {
      const { userAgent } = window.navigator
      if (window.ActiveXObject || 'ActiveXObject' in window) { // IE
        let reIE = new RegExp('MSIE (\\d+\\.\\d+)')
        reIE.test(userAgent)
        let fIEVersion = parseFloat(RegExp.$1)
        return `IE${fIEVersion || '低版本'}`
      } else if (userAgent.indexOf('Firefox') !== -1) {
        return 'Firefox(火狐)'
      } else if (userAgent.indexOf('Opera') !== -1) {
        return 'Opera'
      } else if (userAgent.indexOf('Edge') !== -1) {
        return 'Edge'
      } else if (userAgent.indexOf('QQ') !== -1 && userAgent.indexOf('QQBrowser') === 1) {
        return '手机QQ'
      } else if (userAgent.indexOf('QQBrowser') !== -1) {
        return 'QQ浏览器'
      } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('MetaSr') !== -1) {
        return '搜狗浏览器'
      } else if (userAgent.indexOf('MicroMessenger') !== -1) {
        return '微信浏览器'
      } else if (userAgent.indexOf('LBBROWSER') !== -1) {
        return '猎豹浏览器'
      } else if (userAgent.indexOf('Maxthon') !== -1) {
        return '遨游浏览器'
      } else if (userAgent.indexOf('TheWorld') !== -1) {
        return '世界之窗浏览器'
      } else if (userAgent.indexOf('bWeibo') !== -1) {
        return '微博'
      } else if (userAgent.indexOf('ubrowser') !== -1) {
        return 'UC'
      } else if (userAgent.indexOf('bidubrowser') !== -1) {
        return '百度'
      } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
        return 'Safari'
      } else if (userAgent.indexOf('Chrome') !== -1) {
        return 'Chrome'
      }
    },
  },
}
</script>
