var fomidable = require("formidable")
var db = require('../models/db')
var md5 = require("../models/md5")
var path = require('path')
var fs = require('fs')
var gm = require('gm')

// var haha = require('./haha')
// exports.showxixi = haha.xixi

//首页
exports.showIndex = function (req, res, next) {
    //检索数据库 查找用户头像
    if (req.session.login == "1") {
        //如果登录了
        var username = req.session.username
        var login = true
    } else {
        //没有登录
        var username = ''       //制定一个空用户名
        var login = false
    }
    //已经登录了，检索db，查询用户头像
    db.find("users", {username: req.session.username}, function (err, result) {
        if (result.length == 0) {
            var avatar = 'moren.jpg'
        } else {
            var avatar = result[0].avatar
        }
        // db.find("posts", {}, {"sort": {"datetime": -1}}, function (err, result2) {
        res.render('index', {
            "login": login,
            "username": username,
            "active": "首页",
            "avatar": avatar,
            // "shuoshuo": result2

        })
        // })


    })


}
//注册
exports.showRegist = function (req, res, next) {
    res.render('regist', {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active": "注册"
        }
    )
}

//注册业务
exports.doRegist = function (req, res, next) {
//    得到用户填写的东西
    var form = new fomidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
        var username = fields.username
        var password = fields.password
        // console.log(username, password)
        //    查询db中是否有该用户
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-3")
                return
            }
            if (result.length != 0) {
                res.send("-1")
                return;
            }
            //设置md5加密
            password = md5(md5(password) + "kaola")

            // console.log(result.length)
            db.insertOne("users", {
                "username": username,
                "password": password,
                "avatar": "moren.jpg",
            }, function (err, result) {
                if (err) {
                    res.send("-3")//服务器出错
                    return
                }
                //    注册成功 写入session
                req.session.login = "1"
                req.session.username = username
                res.send("1")

                // console.log(req.session.login)

            })
        })
        //    save

    })

}
//登录页面
exports.showLogin = function (req, res, next) {
    res.render('login', {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active": "登录"
        }
    )
}
//登录页面的执行页面
exports.doLogin = function (req, res, next) {
    //得到用户表单
    var form = new fomidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
        var username = fields.username
        var password = fields.password
        var jiamihou = md5(md5(password) + "kaola")

        // console.log(username, password)
        //查询db 是否存在该用户
//    查看信息是否匹配
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-5")
                return
            }
            //并无此用户
            if (result.length == 0) {
                res.send("-1")
                return;
            }
            if (jiamihou == result[0].password) {
                req.session.login = "1"
                req.session.username = username
                res.send("1")
                return;
            } else {
                res.send("-2")//密码错误
                return;
            }
        })
    })


}
//设置头像页面 前提：用户处于登录状态
exports.showSetavatar = function (req, res, next) {
    if (req.session.login != '1') {
        res.end("非法闯入，请登录")
        return
    }
    res.render("setavatar", {
        "login": true,
        "username": req.session.username || "小花花",
        "active": "更改头像",
    })
}
//设置头像
exports.doSetavatar = function (req, res, next) {
    var form = new fomidable.IncomingForm()
    form.uploadDir = path.normalize(__dirname + '/../avatar')
    form.parse(req, function (err, fields, files) {
        console.log(files)
        var oldpath = files.touxiang.path
        var newpath = path.normalize(__dirname + "/../avatar/") + req.session.username + ".jpg"
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("失败")
                return
            }
            req.session.avatar = req.session.username + '.jpg'
            //跳转到头像裁剪业务
            res.redirect("/cut")
        })
    })
}

//显示切图页面
exports.showCut = function (req, res) {
    if (req.session.login != "1") {
        res.end("非法闯入，请登录！")
        return
    }
    res.render('cut', {
        avatar: req.session.avatar
    })
}

//执行切图
exports.docut = function (req, res, next) {
    if (req.session.login != "1") {
        res.end("非法闯入，请登录！")
        return
    }
    var filename = req.session.avatar
    var w = req.query.w
    var h = req.query.h
    var x = req.query.x
    var y = req.query.y

    gm('./avatar/' + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write('./avatar/' + filename, function (err) {
            if (err) {
                res.send('-1')
                return
            }
            //更改db 当前用户的avatar
            db.updateMany("users", {"username": req.session.username}, {
                    $set: {"avatar": req.session.avatar}
                }, function (err, result) {
                    // res.redirect("/")
                    res.send("1")

                }
            )
        })
}
//发表说说
exports.dopost = function (req, res, next) {
    if (req.session.login != "1") {
        res.end("非法闯入，请登录！")
        return
    }
    var username = req.session.username
//    得到用户填写的东西
    var form = new fomidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
        var content = fields.content


        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content,
        }, function (err, result) {
            if (err) {
                res.send("-3")//服务器出错
                return
            }
            res.send("1")


        })
    })


}
//列出所有说说
exports.getAllShuoshuo = function (req, res, next) {
    var page = req.query.page
    db.find("posts", {}, {"pageamount": 9, "page": page, "sort": {"datetime": -1}}, function (err, result) {
        res.json(result)
    })
}
//列出用户信息
exports.getUserInfo = function (req, res, next) {
    var username = req.query.username
    db.find("users", {"username": username}, function (err, result) {
        if (err || result.length == 0) {
            res.json("");
            return;
        }
        var obj = {
            //保护用户密码
            "useranme": result[0].username,
            "avatar": result[0].avatar,
            "_id": result[0]._id,
        }

        res.json(obj)
    })
}

//说说总数
exports.getAmount = function (req, res, next) {
    db.getAllCount("posts", function (count) {
        res.send(count.toString());
    });
};


exports.showUser = function (req, res, next) {
    var user = req.params["user"]
    db.find("posts", {"username": user}, function (err, result) {
        db.find("users", {"username": user}, function (err, result2) {
            res.render("user", {
                "login": req.session.login == "1" ? true : false,
                "username": req.session.login == "1" ? req.session.username : "",
                "user": user,
                "active": "我的说说",
                "cirenshuoshuo": result,
                "cirentouxiang": result2[0].avatar,
            })
        })
    })
}

//显示所有注册用户
exports.showUserlist = function (req, res, next) {
    db.find("users", {}, function (err, result) {
        res.render("userlist", {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active": "成员列表",
            "allchengyuan": result
        });
    });
}