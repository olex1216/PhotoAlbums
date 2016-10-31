/*后端--帮助函数*/

var fs = require('fs');

/*确认字段*/
exports.verify = function(data,field_names) {
    for (var i = 0; i < field_names.length; i++) {
        if (!data[field_names[i]]) {
            throw exports.error("missing_data",
                                field_names[i]+" not optional");
        }
    }

    return true;
};

/*返回错误*/
exports.error = function(code,msg) {
    var e = new Error(msg);
    e.code = code;
    return e;
};

/*文件错误*/
exports.file_error = function(err) {
    return exports.error("file_error", JSON.stringify(err.message));
};

/**
 * Possible signatures:
 *  src, dst, callback
 *  src, dst, can_overwrite, callback
 */
/*复制文件*/
exports.file_copy = function() {
    var src, dst, callback;
    var can_overwrite = false;

    if (arguments.length == 3) {
        src = arguments[0];
        dst = arguments[1];
        callback = arguments[2];
    } else if (arguments.length == 4) {
        src = arguments[0];
        dst = arguments[1];
        callback = arguments[3];
        can_overwrite = arguments[2];
    }

    function copy(err) {
        var is,os;
        if (!err & !can_overwrite) {
            return callback(backhelp.error("file_exists",
                                    "File " + dst + " exists."));
        }

        fs.stat(src, function(err) {
            if (err) {
               return callback(err);
            }

            is = fs.createReadStream(src);
            os = fs.createWriteStream(dst);
            is.on('end', function () { callback(null); });
            is.on('error', function (e) { callback(e); });
            is.pipe(os);
        });
    }

    fs.stat(dst, copy);
};

/*文件名是否有效*/
exports.valid_filename = function(fn) {
    var re = /[^\.a-zA-Z0-9_-]/;
    return typeof fn == 'string' && fn.length > 0 && !(fn.match(re));
};

/*服务器错误*/
exports.db_error = function() {
    return exports.error("server_error",
        "Something horrible has happened with our database!");
};

/*文件已存在*/
exports.album_already_exists = function () {
    return exports.error("album_already_exists",
                         "An album with this name already exists.");
};