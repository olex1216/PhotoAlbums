/*相册模块*/
var helpers = require('./helpers.js');
var async = require('async');
var fs = require('fs');

exports.version = "0.1.0";

exports.list_all = function(req,res) {
    load_album_list(function(err,albums) {
        if(err){

            helpers.send_failure(res,500,err);
            return;
        }
        helpers.send_success(res, { albums : albums});
    });
};

exports.album_by_name = function (req, res) {
        var getp = req.query;
        var page_num = getp.page ? getp.page : 0;
        var page_size = getp.page_size ? getp.page_size : 1000;

        if (isNaN(parseInt(page_num))) page_num = 0;
        if (isNaN(parseInt(page_size))) page_size = 1000;

        // format of request is /albums/album_name.json
        var album_name = req.params.album_name;
        load_album(
            album_name,
            page_num,
            page_size,
            function (err, album_contents) {
                if (err && err.error == "no_such_album") {
                    helpers.send_failure(res, 404, err);
                }  else if (err) {
                    helpers.send_failure(res, 500, err);
                } else {
                    helpers.send_success(res, { album_data: album_contents });
                }
            }
        );
    };


/*相册列表*/
function load_album_list(callback) {
    fs.readdir(
        "../static/albums",
        function (err, files) {
            if (err) {
                callback({ error: "file_error",
                           message: JSON.stringify(err) });
                return;
            }

            var only_dirs = [];

            // 检测是否为文件夹
            async.forEach(
                files,
                function (element, cb) {
                    fs.stat(
                        "../static/albums/" + element,
                        function (err, stats) {
                            if (err) {
                                cb({ error: "file_error",
                                       message: JSON.stringify(err) });
                                return;
                            }
                            if (stats.isDirectory()) {
                                only_dirs.push({ name: element });
                            }
                            cb(null);
                        }
                    );
                },
                function (err) {
                    callback(err, err ? null : only_dirs);
                }
            );
        }
    );
}

/*照片列表*/
function load_album(album_name,page,page_size,callback) {
    fs.readdir(
        "../static/albums/"+album_name,
        function (err, files) {
            if (err) {
                if (err.code == "ENOENT") {
                    callback(helpers.no_such_album());
                } else {
                    callback({ error: "file_error",
                               message: JSON.stringify(err) });
                }
                return;
            }

            var only_files = [];
            var path = "../static/albums/" + album_name +"/";

            // 检测是否文件
            async.forEach(
                files,
                function (element, cb) {
                    fs.stat(
                        path + element,
                        function (err, stats) {
                            if (err) {
                                cb({ error: "file_error",
                                    message: JSON.stringify(err) });
                                return;
                            }
                            if (stats.isFile()) {
                                var obj = { filename: element,
                                            desc: element };
                                only_files.push(obj);
                            }
                            cb(null);
                        }
                    );
                },
                function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        var ps = page_size;
                        var photos = only_files.slice(page * ps, ps);
                        var obj = { short_name: album_name,
                                    photos: photos };
                        callback(null, obj);
                    }
                }
            );
        }
    );

}