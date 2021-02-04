// 拷贝一个对象
let _extends = Object.assign || function (target) {
  for (let i = 1; i < arguments.length; i++) {
    let source = arguments[i];
    for (let key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

// 设置开关，避免第一次进入页面的时候把自定义数据删除了
let flag = false
// 微信全局路由切换监听
wx.onAppRoute(function(res){
  console.log('微信全局路由切换监听', res);
  if(flag){
    wx.clearCustomData()
  }
  else {
    flag = true
  }
})

export default function () {
    // 判断是否传入参数
    let interceptors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // 复制一份wx对象出来备用
    let oldWx = wx;
    // 复制一份wx对象出来改写request请求，加上请求前，请求后的回调
    let newWx = _extends({}, wx);

    newWx.request = (params) => {
        // 请求前的参数拦截
        interceptors.request &&  interceptors.request(params)

        // 复制多一份微信的原生参数对象，不然直接使用会造成死循环
        let newParms = _extends({}, params)

        // 改写complete回调函数
        Object.assign(newParms, {
            complete: function complete(res){
                // 请求后的结果拦截
                interceptors.response &&  interceptors.response(res)
                params.complete && params.complete(res)
            }
        })

        // 再用备份的wx对象, 执行改写后的参数对象，这样就可以不影响原生小程序的wx.request使用，而且我们也做了拦截器对象interceptors
        oldWx.request(newParms)
    }
    // 添加自定义全局数据，每个上报的数据都有，用于保存用户名等固定信息
    newWx.addGlobalData = function(obj){
      newWx.globalData2 = obj
    }
    // 删除全局数据
    newWx.clearGlobalData = function(obj){
      newWx.globalData = null
    }
    // 添加设置自定义数据方法
    newWx.addCustomData = function(obj){
      newWx.customData = obj
    }
    // 删除自定义数据
    newWx.clearCustomData = function(){
      newWx.customData = null
    }

    wx = newWx
}
