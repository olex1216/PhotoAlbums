/*express 处理请求*/

var express = require('express');
var app = express();

var fs = require('fs');
var album_hdlr = require('./handlers/albums.js');
var page_hdlr = require('./handlers/pages.js');
var helpers = require('./handlers/helpers.js');

/*处理请求*/
app.use(express.static( __dirname + "/../static"));/*静态内容*/
app.get('/v1/albums.json', album_hdlr.list_all);/*相册*/
app.get('/v1/albums/:album_name.json', album_hdlr.album_by_name);/*照片*/
app.get('/pages/:page_name',page_hdlr.generate);//页面
app.get('/pages/:page_name/:sub_page', page_hdlr.generate);
app.get("/", function (req, res) {
    res.redirect("/pages/home");
    res.end();
});
app.get('*',four_oh_four);/*404*/

/*404页面*/
function four_oh_four(req, res) {
    helpers.send_failure(res, 404, helpers.invalid_resource);
}

app.listen(8080);