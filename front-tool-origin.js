!function () {
  let runtimeEnvObj = { // 【设置项】运行环境对象
    dev: '',
    test: '',
    pre: '',
    prod: '',
  }

  let avConf = { // 【设置项】秘钥
    appId: '01Gf3GNWM0CvsUW01ahkPjVV-gzGzoHsz',
    appKey: 'P5baasBnbzGMJIlcepWDIbiU',
  }

  let menuList = [{ // 【设置项】自定义菜单
    name: '测试',
    callback: () => { setTips('测试') }
  }]

  let ajaxHook = () => {} // 【设置项】外部请求检测钩子

  let globalData = {} // 自定义全局数据，每个上报的数据都有，用于保存用户名等固定信息
  let customData = {}  // 当前页面收集的参数
  let ajaxList = [] // ajax请求数组
  let browserType = null // 浏览器种类
  let runEnvironment = 'local' // 当前运行环境

  let $reportDate = null // 数据上报按钮 dom
  let $btnEntrance = null // XX环境按钮 dom
  let $box = null // 窗体主体 dom
  let $close = null // 关闭弹窗按钮 dom
  let $tip = null // 提示框 dom
  let $clear = null // 清理缓存按钮 dom

  // 解析参数
  function getParams(url, key) {
    let params = {}
    url = decodeURIComponent(url.replace(/%/g, '%25'))
    url.replace(/[?|&](\w+)=([^&^?]*)/g, (matchStr, $1, $2) => {
      params[$1] = $2
    })
    return key ? params[key] : params
  }

  // 动态加载 JS
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      let $script = document.createElement('script')
      $script.src = url
      $script.async = true
      $script.addEventListener('error', function () {
        reject()
      })
      $script.addEventListener('load', function () {
        resolve()
      })
      document.body.appendChild($script)
    })
  }

  // 添加 bug 收集工具
  function initHTML() {
    // 获取运行环境
    runEnvironment = getRuntimeEnv()

    // 获取浏览器信息
    browserType = getBrowserType()

    // 自定义菜单
    let menuDomStr = menuList.map(menuItem => `<li id=${menuItem.id}>${menuItem.name}</li>`).join()

    // 添加工具
    let div = document.createElement('div')
    div.innerHTML = `
<section class="c-front-tool">
    <section id="box" class="c-mask-box" style="display: none">
        <div class="mask"></div>
        <div class="content-box">
            <div class="control-box">
                <ul id="li-menu">
                    <li id="report-date"> 数据上报</li>
                    <li id="clear"> 清除缓存数据</li>
                    ${menuDomStr}
                    <li id="close"> 关闭弹窗</li>
                </ul>
            </div>
        </div>
    </section>
    <div id="tips" class="c-tips c-tips--show" style="display: none"></div>
    <div id="btn-entrance" class="btn-entrance">${runEnvironment}环境</div>
</section>`
    document.body.append(div)

    // 获取 dom 对象
    $reportDate = document.getElementById('report-date') // 数据上报按钮 dom
    $btnEntrance = document.getElementById('btn-entrance') // XX环境按钮 dom
    $box = document.getElementById('box') // 窗体主体 dom
    $close = document.getElementById('close') // 关闭弹窗按钮 dom
    $tip = document.getElementById('tips') // 提示框 dom
    $clear = document.getElementById('clear') // 清理缓存按钮 dom
  }

  // 合并配置项
  function mergeConf() {
    runtimeEnvObj = window.$runtimeEnvObj || runtimeEnvObj
    avConf = window.$avConf || avConf
    menuList = window.$menuList || menuList
    ajaxHook = window.$ajaxHook || ajaxHook
  }

  // 设置点击事件
  function setBtnClick() {
    $reportDate.onclick = () => { reportDate() } // 上报数据
    $btnEntrance.onclick = () => { $box.style.display = 'block' } // 打开窗口
    $close.onclick = () => { $box.style.display = 'none' } // 打开窗口
    $clear.onclick = () => { // 清理缓存按钮
      sessionStorage.clear()
      localStorage.clear()
      setTips('数据清除成功')
    }
  }

  // 重写ajax
  function resetAjax() {
    if (window._hadResetAjax) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
      return
    }
    window._hadResetAjax = true
    let originXHR = window.XMLHttpRequest
    let originOpen = originXHR.prototype.open
    let originSend = originXHR.prototype.send
    let originSetRequestHeader = originXHR.prototype.setRequestHeader

    // 重置事件
    window.XMLHttpRequest = function () {
      let ajaxData = {} // 整个ajax数据，收集数据时用
      let realXHR = new originXHR() // 重置操作函数，获取请求数据

      realXHR.open = function (method, url, asyn) {
        ajaxData.request = {
          method: method,
          url: url.split('?')[0],
          data: getParams(url),
          header: {}
        }
        originOpen.call(realXHR, method, url, asyn)
      }

      // 重置设置请求头的函数
      realXHR.setRequestHeader = function (header, value) {
        ajaxData.request.header[header] = value
        originSetRequestHeader.call(realXHR, header, value)
      }

      // 重置操作函数，获取请求数据
      realXHR.send = function (postData) {
        ajaxData.request.timeout = realXHR.timeout
        ajaxData.request.responseType = realXHR.responseType

        if (ajaxData.request.method === 'POST' && postData) {
          let header = ajaxData.request.header

          if (header['Content-Type'].indexOf('application/json') > -1) {
            ajaxData.request.data = JSON.parse(postData)
          } else if (header['Content-Type'].indexOf('application/x-www-form-urlencoded') > -1) {
            ajaxData.request.data = getParams('?'.concat(postData))
          }
        }

        try { // 防止timeout等报错，造成程序阻塞
          originSend.call(realXHR, postData)
        } catch (e) {
          console.log(e)
        }
      }

      // 监听加载完成，获取回复的报文
      realXHR.addEventListener('loadend', function () {
        ajaxData.response = realXHR.response
        if (ajaxData.request.url.indexOf('leancloud.cn') === -1) {
          ajaxList.push(ajaxData)
          ajaxHook && ajaxHook(ajaxData) && reportDate() // 外部执行钩子
        }
      }, false)
      return realXHR
    }
  }

  // 获取浏览器信息
  function getBrowserType() {
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
  }

  // 提示框内容
  function setTips(title) {
    $tip.innerText = title // 提示框内容
    $tip.style.display = 'block' // 显示提示框
    $box.style.display = 'none' // 关闭窗体
    setTimeout(function () {
      $tip.style.display = 'none' // 关闭提示框
    }, 1500)
  }

  // 获取运行环境
  function getRuntimeEnv() {
    for (let key in runtimeEnvObj) {
      if (location.href.indexOf(runtimeEnvObj[key]) !== -1) {
        return key
      }
    }
    return 'local'
  }

  // 提交数据
  function reportDate() {
    const bugClass = AV.Object.extend('bug')
    let bug = new bugClass()
    bug.set('env', runEnvironment) // 当前环境
    bug.set('hostEnv', browserType) // 运行的浏览器
    bug.set('pageURL', location.href) // 页面路径
    bug.set('useragent', navigator.userAgent) // 浏览器信息
    bug.set('ajax', ajaxList) // 接口信息
    bug.set('custom', Object.assign({}, globalData, customData)) // 自定义数据
    bug.save().then((res) => {
      const title = 'BUG上报成功，信息ID：' + res.id
      setTips(title)
    }, function (error) {
      alert(JSON.stringify(error))
    })
  }

  // 设置样式
  function setStyle() {
    let code = `.c-mask-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
.c-mask-box .mask {
  position: fixed;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background-color: #000000;
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
  z-index: 9999;
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
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  border-radius: 4px;
  background-color: #3D8AC7;
  list-style:none;
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
  color: #FFFFFF;
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
  background-color: #FFFFFF;
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
}`
    let style = document.createElement('style')
    style.type = 'text/css'
    style.rel = 'stylesheet'
    style.appendChild(document.createTextNode(code))
    let head = document.getElementsByTagName('head')[0]
    head.appendChild(style)
  }

  // 添加全局数据，在每个上报的数据中都有
  function addGlobalData(data) {
    globalData = Object.assign(globalData, data)
  }

  // 添加全局数据，在每个上报的数据中都有
  function clearGlobalData() {
    globalData = {}
  }

  // 添加自定义数据
  function addCustomData(data) {
    customData = Object.assign(customData, data)
  }

  // 添加自定义数据
  function clearCustomData() {
    customData = {}
  }

  // 挂载全局变量
  function setGlobalFun() {
    window.$addGlobalData = addGlobalData
    window.$addCustomData = addCustomData
    window.$clearGlobalData = clearGlobalData
    window.$clearCustomData = clearCustomData
  }

  // 初始化
  function init() {
    mergeConf()
    loadScript('https: // cdn1.lncld.net/static/js/av-min-1.2.1.js').then(() => { AV.init(avConf) })
    resetAjax() // 重写ajax
    initHTML() // 添加工具的 html 代码
    setStyle() // 动态创建css
    setBtnClick() // 点击事件
    setGlobalFun() // 挂载全局函数
  }

  init() // 初始化
}()
