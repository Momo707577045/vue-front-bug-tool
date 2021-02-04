// 导入leanclou的组件
import AV from 'leancloud-storage/dist/av-weapp.js'
import wxResetRequest from './wxResetRequest'
// leancloud的域名
const serverURL = "https://wg80abrl.lc-cn-n1-shared.com"
// 请求一条记录信息
let ajaxData = {}
// 多条请求记录信息数组
let ajaxList = []
wxResetRequest({
  request(req){
    if(req.url.indexOf(serverURL) === -1){
      ajaxData['request'] = req
    }
  },
  response(res){
      ajaxData['response'] = res
      ajaxList.push(ajaxData)
  }
})
Component({
  data: {
      tips: '', // 提示文案
      tipsTimeout: -1, // 提示文案重置计时器
      runtimeEnv: '开发', // 当前运行环境
      showTips: false, // 是否显示控制面板
      showBox: false, // 是否显示控制面板
      isClose: false, // 是否关闭工具
  },
  options: {
    styleIsolation: 'isolated'
  },
  properties: {
    menu: Array // 简化的定义方式
  },
  // 组件生命周期函数-在组件实例进入页面节点树时执行
  created: function () { 
    // 获取运行环境
    this.runtimeEnv = this.getRuntimeEnv()
    if (this.runtimeEnv !== 'production' || this.useInProd) {
      this.init()
    }
  },
  methods: {
    // 初始化，重写AJAX，往全局添加函数
    async init() {
      AV.init({
        appId: 'wG80ABRLiltFyle1Og4w2t17-gzGzoHsz',
        appKey: 'teVOQOS5KxE0JwJsul9vWEPO',
        serverURL
      })
    },

    // 切换显示弹窗
    showBoxFun(){
        console.log(this.data.showBox);
        this.setData({
            showBox: !this.data.showBox
        })
    },
    myCallback(e){
      const name = e.target.dataset.name
      this.data.menu.filter(r => r.name === name)[0].callback()
    },
    // 关闭工具
    isCloseFun(){
        this.setData({
            isClose: !this.data.isClose
        })
    },
    // 清除缓存
    clearStorage() {
      wx.clearStorageSync()
      this.setData({
        showBox: !this.data.showBox,
        showTips: true,
        tips: '数据清除成功，即将重新加载'
      })

    },
    // 获取运行环境
    getRuntimeEnv() {
        let obj = {
          development: '开发',
          production: '生产'
        }
        return obj[process.env.NODE_ENV]
    },
    // 上报数据
    reportDate(){
      console.log('wx ', wx);
      console.log('wx.customData ', wx.customData);
      const that = this;
      if(!ajaxList.length){
        wx.showToast({
          title: '没有请求过接口',
          icon: 'none',
          duration: 2000
        })
        
        return;
      }
      const bugClass = AV.Object.extend('bug')
      let bug = new bugClass()
      // 获取当前页面信息
      let pages = getCurrentPages();
      let currPage = pages[pages.length - 1];

      bug.set('env', this.runtimeEnv) // 当前环境
      bug.set('hostEnv', '小程序') // 运行的浏览器
      bug.set('pageURL', currPage.__route__) // 页面路径
      bug.set('params', currPage.options) // 页面参数
      const systemInfo = wx.getSystemInfoSync()
      bug.set('useragent', JSON.stringify(systemInfo)) // 手机信息
      bug.set('custom', Object.assign({}, wx.globalData, wx.customData)) // 自定义数据
      bug.set('ajax', ajaxList) // 接口信息
      bug.save().then((res) => {
        that.setData({
          showBox: false,
          showTips: true,
          tips: `数据上报成功，信息ID为：${res.id}`
        })
        ajaxList = []
        setTimeout(() => {
          that.setData({
            showTips: false,
          })
        }, 3000);
      }, function (error) {
        console.log(error);
        wx.showToast({
          title: error,
          icon: 'none',
          duration: 2000
        })
      });
    },
    // 空函数
    emptyFun(){}
  }
})