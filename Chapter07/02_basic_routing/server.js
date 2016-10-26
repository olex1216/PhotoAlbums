/*express 处理请求*/

var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');
var async = require('async');

/*处理请求*/
app.get('/albums.json',handle_list_albums);
app.get('/albums/:album_name.json',handle_get_album);
app.get('/content/:filename',function(req,res) {
    serve_static_file('content/'+req.params.filename,res);
});
app.get('/templates/:template_name',function(req,res) {
    serve_static_file('templates/'+req.params.template_name,res);
});
app.get('/pages/:page_name',serve_page);
app.get('/pages/:page_name/:sub_page', serve_page);
app.get('*',four_oh_four);

/*404页面*/
function four_oh_four(req, res) {
    send_failure(res, 404, invalid_resource());
}

 /*请求一：页面*/
function serve_page(req,res) {

    var page = req.params.page_name;
    fs.readFile(
        'basic.html',
        function (err, contents) {
            if (err) {
                send_failure(res, 500, err);
                return;
            }

            contents = contents.toString('utf8');

            // replace page name, and then dump to output.
            contents = contents.replace('{{PAGE_NAME}}', page);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(contents);
        }
    );
}

/*请求二、三：处理静态内容和模板文件*/
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

/*请求四：相册列表*/
function handle_list_albums(req,res) {
    load_album_list(function(err,albums) {
        if (err) {
            send_failure(res,500,err);
            return;
        }
        send_success(res,{albums:albums});/*请求成功*/
    });
}
/*相册列表*/
function load_album_list(callback) {
    fs.readdir(
        "albums",
        function (err, files) {
            if (err) {
                callback({ error: "file_error",
                           message: JSON.stringify(err) });
                return;
            }

            var only_dirs = [];
            // 检测是否为文件夹
            (function iterator(index) {
                //检测结束
                if (index == files.length) {
                    callback(null, only_dirs);
                    return;
                }

                fs.stat(
                    "albums/" + files[index],
                    function (err, stats) {
                        if (err) {
                            callback({ error: "file_error",
                                     message: JSON.stringify(err) });
                            return;
                        }
                        if (stats.isDirectory()) {
                            var obj = {name:files[index]};
                            only_dirs.push(obj);
                        }
                        iterator(index + 1);
                    }
                );
            })(0);
        }
    );
}

/*请求五：照片列表*/
function handle_get_album(req,res) {
    // get the GER params
    var getp = req.query;
    var page_num = getp.page ? getp.page : 0;
    var page_size = getp.page_size ? getp.page_size : 1000;

    if(isNaN(parseInt(page_num))){
        page_num = 0;
    }
    if(isNaN(parseInt(page_size))){
        page_size = 1000;
    }

    var album_name = req.params.album_name;

    load_album(
        album_name,
        page_num,
        page_size,
        function(err,album_contents) {
            if (err && err.error == "no_such_album") {
                send_failure(res,404,err);
                return;
            } else if (err) {
                send_failure(res,404,err);
                return;
            } else {
                send_success(res,{album_data: album_contents});
            }
    });
}

/*照片列表*/
function load_album(album_name,page,page_size,callback) {
    fs.readdir(
        "albums/"+album_name,
        function (err, files) {
            if (err) {
                if (err.code == "ENOENT") {
                    callback(no_such_album());
                } else {
                    callback({ error: "file_error",
                               message: JSON.stringify(err) });
                }
                return;
            }

            var only_files = [];
            var path = "albums/" + album_name +"/";
            // 检测是否文件
            (function iterator(index) {
                //检测结束
                if (index == files.length) {
                    var ps ;
                    ps = only_files.splice(page*page_size,page_size);
                    var obj = {short_name:album_name,
                                photos:ps};
                    callback(null, obj);
                    return;
                }

                fs.stat(
                    path + files[index],
                    function (err, stats) {
                        if (err) {
                            callback({ error: "file_error",
                                     message: JSON.stringify(err) });
                            return;
                        }
                        if (stats.isFile()) {
                            var obj = {filename:files[index],
                                    desc:files[index]};
                            only_files.push(obj);
                        }
                        iterator(index + 1);
                    }
                );
            })(0);
        }
    );

}

/*请求成功*/
function send_success(res,data) {
    res.writeHead(200,{"Content-Type" : "applicathon/json"});
    var output = {error:null,data:data};
    res.end(JSON.stringify(output)+"\n");
}

/*请求失败*/
function send_failure(res,code,err) {
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}



function invalid_resource() {
    return { error: "invalid_resource",
             message: "the requested resource does not exist." };
}


function no_such_album() {
    return { error: "no_such_album",
             message: "The specified album does not exist" };
}



app.listen(8080);