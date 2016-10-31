/*express 处理请求*/

var express = require('express');
var app = express();

var db = require('./data/db.js');
var album_hdlr = require('./handlers/albums.js');
var page_hdlr = require('./handlers/pages.js');
var helpers = require('./handlers/helpers.js');

/*处理请求*/
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true }));
app.use(express.static( __dirname + "/../static"));/*静态内容*/

app.get('/v1/albums.json', album_hdlr.list_all);/*获取相册列表*/
app.put('/v1/albums.json', album_hdlr.create_album);/*创建新相册*/

app.get('/v1/albums/:album_name.json', album_hdlr.album_by_name);//根据名称检索相册
app.get('/v1/albums/:album_name/photos.json', album_hdlr.photos_for_album);//获取相册中的照片
app.put('/v1/albums/:album_name/photos.json', album_hdlr.add_photo_to_album);//添加新照片

app.get('/pages/:page_name',page_hdlr.generate);//页面
app.get('/pages/:page_name/:sub_page', page_hdlr.generate);

app.get("/", function (req, res) {/*重定向*/
    res.redirect("/pages/home");
    res.end();
});

app.get('*',four_oh_four);/*404*/

/*404页面*/
function four_oh_four(req, res) {
    helpers.send_failure(res, 404, helpers.invalid_resource);
}

db.init(function (err, results) {
    if (err) {
        console.error("** FATAL ERROR ON STARTUP: ");
        console.error(err);
        process.exit(-1);
    }


    app.listen(8080);
});

