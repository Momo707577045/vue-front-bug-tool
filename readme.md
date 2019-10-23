# 项目详细介绍请[点击这里](https://segmentfault.com/a/1190000017271720)查看

# VUE组件使用说明
*设置好LeanCloud，我们就可以使用信息收集的组件了*
### 组件的载入
- 按常规载入方式即可，[点击这里](https://github.com/Momo707577045/vue-front-bug-tool)，获取源码
- 将代码文件夹放入项目中，例如这里放在components文件夹中
- 在全部VUE中载入组件，如layout组件中
- 引用 ```import FrontTool from '@/components/front-tool/front-tool'```
- 注册 ```components: {FrontTool},```
- 使用 ```<front-tool/>```

  ![使用配图](http://momo-project.b0.upaiyun.com/Assets/bugSystem/imgs/019.png)


### VUE 非集成化接入方式
*脱离 webpack，不需要 babel 转码。降低使用成本*
- 通过 「script」标签导入工具，```<script src="./front-tool.js"></script>```
- 该 script 文件将在 「window」对象中挂载一个「frontTool」变量
- 在 vue 主程序中，正常使用组件
    ```
    <div id="app">
      <front-tool></front-tool>
    </div>
    </body>

    <script src="./vue.js"></script>
    <script src="./front-tool.js"></script>
    <script>
    new Vue({
      el: '#app',
      components: {
        'frontTool': window.frontTool,
      },
    })
    ```
- 修改「front-tool.js」源码中的「App ID」和「App Key」
- 【注意】由于非集成化的特点，为实现代码复用，减少配置。以下三项配置将从「props」迁移到「data」中，故只能通过修改源码进行功能扩展。
```
 menu: [],
 useInProd: false, // 在生产环境也使用
 ajaxHook: () => {}, // 外部请求检测钩子
```

### [API介绍](https://raw.githubusercontent.com/Momo707577045/VUE-front-bug-tool/master/front-tool.VUE)
- 【this.$addCustomData(Object)】 添加自定义数据，即在数据收集时，上报特定的自定义数据，通过key-value方式保存。
- 【this.$clearCustomData()】 清除自定义数据，该方法将在路由变化时自动被调用，即自定义数据仅在当前路由有效，路由跳转后将自动清空。
- 【this.$addGlobalData(Object)】添加全局自定义数据，在整个程序中有效，每次上报数据都将携带该信息，可用于保存用户账号密码等全局信息，以便改bug时重新登录该账号，重现问题
- 【this.$clearGlobalData()】清除全局自定义数据。
- 以上函数均自动注册到VUE全局函数中，在VUE文件中直接通过```this.```调用即可
- 以上函数在生成环境中将会自动失效，不用担心报错，无需特别注释相关代码。

### 修改配置文件
- 修改LeanCloud的配置信息，打开front-tool.VUE，找到AV.init， 填入前面记录的 LeanCloud 的「App ID」和「App Key」。

  ![使用配图](http://momo-project.b0.upaiyun.com/Assets/bugSystem/imgs/020.png)

- 修改对应各个环境的域名前缀。若全部都不命中，则自动设置为local本地环境。
  ```
  let envObj = {
    dev: '-d.xxx.com', // 开发环境域名前缀
    test: '-t.xxx.com', // 测试环境域名前缀
    pre: '-p.xxx.com', // 预发布环境域名前缀
    prod: '.xxx.com', // 正式环境域名前缀
  }
  ```
  ![使用配图](http://momo-project.b0.upaiyun.com/Assets/bugSystem/imgs/021.png)
