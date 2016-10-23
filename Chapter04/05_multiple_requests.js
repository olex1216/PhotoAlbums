/*Code-4.2 处理多种请求*/
var http = require('http');
var fs = require('fs');

/*处理请求*/
function handle_incoming_request(req,res) {

    console.log("INCOMING REQUEST: " + req.method + " " + req.url);

    if (req.url == '/albums.json') {
        handle_list_albums(req,res);/*请求一：相册列表*/
    } else if (req.url.substr(0,7) == '/albums'
        && req.url.substr(req.url.length-5) == '.json') {
        handle_get_album(req,res);/*请求二：相册内的照片列表*/
    } else {
        send_failure(res,404,invalid_resource());/*请求失败*/
    }
}

/*请求一：相册列表*/
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
                callback(make_error("file_error",JSON.stringify(err)));
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
                            callback(make_error("file_error",JSON.stringify(err)));
                            return;
                        }
                        if (stats.isDirectory()) {
                            var obj = {name:files[index]}
                            only_dirs.push(obj);
                        }
                        iterator(index + 1);
                    }
                );
            })(0);
        }
    );
}

/*请求二：相册内的照片列表*/
function handle_get_album(req,res) {
    // format of request is /albums/album_name.json
    var album_name = req.url.substr(7,req.url.length-12);
    load_album(
        album_name,
        function(err,album_contents) {
            if (err && err.error == "no_such_album") {
                send_failure(res,404,err);
            } else if (err) {
                send_failure(res,404,err)
            } else {
                send_success(res,{album_data: album_contents});
            }
    });
}

/*照片列表*/
function load_album(album_name,callback) {
    fs.readdir(
        "albums"+album_name,
        function (err, files) {
            if (err) {
                if (err.code == "ENOENT") {
                    callback(no_such_album())
                } else {
                    callback(make_error("file_error",JSON.stringify(err)));
                }
                return;
            }

            var only_files = [];
            var path = "albums/" + album_name +"/";
            // 检测是否文件
            (function iterator(index) {
                //检测结束
                if (index == files.length) {
                    var obj = {short_name:album_name,
                                photos:only_files};
                    callback(null, obj);
                    return;
                }

                fs.stat(
                    path + files[index],
                    function (err, stats) {
                        if (err) {
                            callback(make_error("file_error",JSON.stringify(err)));
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
    var code = (err.code)?err.code:err.name;
    res.writeHead(code,{"Content-Type" : "applicathon/json"});
    res.end(JSON.stringify({error:code,message:err.message})+"\n");
}

/*make error*/
function make_error(err,msg) {
    var e = new Error(msg);
    e.code = err;
    return e;
}

function invalid_resource() {
    return make_error('invalid_resource', "the requested resource does not exist");
}


function no_such_album() {
    return make_error('no_such_album', "The specified album does not exist");

}

var s = http.createServer(handle_incoming_request);
s.listen(8080);