
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


