/*express 处理请求*/

var express = require('express');
var app = express();

var fs = require('fs');
var path = require('path');
var album_hdlr = require('./handlers/albums.js');
var page_hdlr = require('./handlers/pages.js');
var helpers = require('./handlers/helpers.js');

/*处理请求*/


app.get('/v1/albums.json', album_hdlr.list_all);/*一.相册*/

app.get('/v1/albums/:album_name.json', album_hdlr.album_by_name);/*二.照片*/

app.get('/albums/:album_name/:filename', function (req, res) {
    serve_static_file('albums/' + req.params.album_name + "/"+ req.params.filename, res);});

app.get('/content/:filename',function(req,res) {
    serve_static_file('content/'+req.params.filename,res);
});//静态内容

app.get('/templates/:template_name',function(req,res) {
    serve_static_file('templates/'+req.params.template_name,res);
});//模板

app.get('/pages/:page_name',page_hdlr.generate);//页面

app.get('/pages/:page_name/:sub_page', page_hdlr.generate);

app.get('*',four_oh_four);

/*404页面*/
function four_oh_four(req, res) {
    helpers.send_failure(res, 404, invalid_resource());
}


/*处理静态内容和模板文件*/
function serve_static_file(file, res) {
    fs.exists(file, function (exists) {
        if (!exists) {
            res.writeHead(404, { "Content-Type" : "application/json" });
            var out = { error: "not_found",
                        message: "'" + file + "' notttt found" };
            res.end(JSON.stringify(out) + "\n");
            return;
        }

        var rs = fs.createReadStream(file);
        rs.on(
            'error',
            function (e) {
                res.end();
            }
        );

        var ct = content_type_for_file(file);
        res.writeHead(200, { "Content-Type" : ct });
        rs.pipe(res);
    });
}

/*内容类型*/
function content_type_for_file (file) {
    var ext = path.extname(file);
    switch (ext.toLowerCase()) {
        case '.html': return "text/html";
        case ".js": return "text/javascript";
        case ".css": return 'text/css';
        case '.jpg': case '.jpeg': return 'image/jpeg';
        default: return 'text/plain';
    }
}

app.listen(8080);