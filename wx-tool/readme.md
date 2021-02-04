
### 在微信小程序（游戏）与 QQ 小程序（游戏）中使用 LeanCloud

[https://leancloud.cn/docs/weapp.html](https://leancloud.cn/docs/weapp.html)

可以根据上面链接教程，在自己项目安装LeanCloud

### 把tool整个文件夹直接复制到项目即可

tool是采用Component 构造器定义的组件

引入组件的时候，在json文件配置下

```js
{
    usingComponents: {
    // 定义需要引入的第三方组件
    // 1. key 值指定第三方组件名字，以小写开头
    // 2. value 值指定第三方组件 js 文件的相对路径
    'tool': '../../components/tool/tool'
  }
}
```

### api介绍
- `wx.addCustomData(Object)` 添加自定义数据，即在数据收集时，上报特定的自定义数据，通过key-value方式保存。
- `wx.clearCustomData()` 清除自定义数据，该方法将在路由变化时自动被调用，即自定义数据仅在当前路由有效，路由跳转后将自动清空。
- `wx.addGlobalData(Object)`添加全局自定义数据，在整个程序中有效，每次上报数据都将携带该信息，可用于保存用户账号密码等全局信息，以便改bug时重新登录该账号，重现问题
- `wx.clearGlobalData()` 清除全局自定义数据。
以上函数均自动注册到wx对象中，在小程序中直接通过wx.调用即可


