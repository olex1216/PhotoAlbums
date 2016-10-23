/*Code-4.6  POST数据*/

var http = require('http');
var fs = require('fs');
var url = require('url');

/*处理请求*/
function handle_incoming_request(req,res) {
    req.parsed_url =  url.parse(req.url,true);
    var core_url = req.parsed_url.pathname;

    if (core_url == '/albums.json' && req.method.toLowerCase() == 'get') {
        handle_list_albums(req,res);/*请求一：相册列表*/
    } else if(core_url.substr(core_url.length-12) == '/rename.json'
              & req.method.toLowerCase() == 'post'){
        handle_rename_album(req,res);
    }else if (core_url.substr(0,7) == '/albums'
              & core_url.substr(core_url.length-5) == '.json'
              & req.method.toLowerCase() == 'get') {
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

/*请求二：重命名相册*/
function handle_rename_album(req,res) {
    // 1. Get the album name from the URL
    var core_url = req.parsed_url.pathname;
    var parts = core_url.split('/');
    if (parts.length != 4) {
        send_failure(res, 404, invalid_resource());
        return;
    }
    var album_name = parts[2];

    // 2. get the POST data for the request. this will have the JSON
    // for the new name for the album.
    var json_body = '';
    req.on(
        'readable',
        function() {
            var d = req.read();
            if (d){
                if (typeof d == 'string') {
                    json_body += d;
                } else if(typeof d == 'object' && d instanceof Buffer){
                    json_body += d.toString('utf8');
                }
            }
        });

    // 3. when we have all the post data, make sure we have valid
    //    data and then try to do the rename.
    req.on(
        'end',
        function() {
            if (json_body) {
                var album_data;
                try {
                    album_data = JSON.parse(json_body);
                    if(!album_data.album_name){
                        send_failure(res,403,missing_data('album_name'));
                        return;
                    }

                } catch(e){
                    // got a body, but not valid json
                    send_failure(res,403,bad_json());
                    return;
                }
                // 4.Perform rename
                do_rename(
                    album_name,            //old_name
                    album_data.album_name, //new_name
                    function(err,results) {
                        if (err && err.code == "ENOENT") {
                            send_failure(res, 403, no_such_album());
                            return;
                        } else if (err) {
                            send_failure(res, 500, file_error(err));
                            return;
                        }
                        send_success(res, null);
                    });

            } else {//didn't get a body
                send_failure(res,403,bad_json());
                res.end();
            }
        });

}

/*请求三：相册内的照片列表*/
function handle_get_album(req,res) {
    // get the GER params
    var getp = req.parsed_url.query;
    var page_num = getp.page ? getp.page : 0;
    var page_size = getp.page_size ? getp.page_size : 1000;

    if(isNaN(parseInt(page_num))){
        page_num = 0;
    }
    if(isNaN(parseInt(page_size))){
        page_size = 1000;
    }

    var core_url = req.parsed_url.pathname;
    var album_name = core_url.substr(7,core_url.length-12);

    load_album(
        album_name,
        page_num,
        page_size,
        function(err,album_contents) {
            if (err && err.error == "no_such_album") {
                send_failure(res,404,err);
            } else if (err) {
                send_failure(res,404,err);
            } else {
                send_success(res,{album_data: album_contents});
            }
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

/*照片列表*/
function load_album(album_name,page,page_size,callback) {
    fs.readdir(
        "albums"+album_name,
        function (err, files) {
            if (err) {
                if (err.code == "ENOENT") {
                    callback(no_such_album());
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

/*重命名相册*/
function do_rename(old_name , new_name , callback) {
    // rename the album folder.
    fs.rename(
        "albums/" + old_name,
        "albums/" + new_name,
        callback);
}

/*请求成功*/
function send_success(res,data) {
    res.writeHead(200,{"Content-Type" : "applicathon/json"});
    var output = {error:null,data:data};
    res.end(JSON.stringify(output)+"\n");
}

/*请求失败*/
function send_failure(res,code,err) {
    var code = (err.code) ? err.code : err.name;
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