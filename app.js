// 引入模块
var express = require('express')

var router = require('./router/router')

var session = require("express-session")

var app = express()

//使用session
app.use(session(
    {
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
    }
))

//模板引擎
app.set("view engine", 'ejs')

// 静态页面
app.use(express.static('./public'))
app.use('/avatar', express.static('./avatar'))

//路由表
app.get('/', router.showIndex)                  // 显示首页
app.get('/regist', router.showRegist)           // 显示注册
app.post('/doregist', router.doRegist)          // 执行注册 ajax
app.get('/login', router.showLogin)             // 显示登录
app.post('/dologin', router.doLogin)            // 执行登录 ajax
app.get('/setavatar', router.showSetavatar)     // 设置头像页面
app.post('/dosetavatar', router.doSetavatar)    // 执行设置头像 ajax
app.get('/cut', router.showCut)                 // 显示头像裁剪页面
app.post("/post", router.dopost)                 //发表说说
app.get('/docut', router.docut)                 // 执行裁剪
app.get('/getallshuoshuo',router.getAllShuoshuo)
app.get('/getuserinfo',router.getUserInfo)
app.get('/getamount',router.getAmount)
app.get("/user/:user",router.showUser)
app.get("/post/:oid",router.showUser)
app.get('/userlist',router.showUserlist)


// app.get('/xixi', router.showxixi)

//设置端口号
app.listen(2222)