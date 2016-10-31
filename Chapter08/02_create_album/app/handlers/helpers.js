/*帮助模块*/
var path = require('path');
exports.version = '0.1.0';

/*请求成功*/
exports.send_success = function(res, data){
    res.writeHead(200,{"Content-Type" : "applicathon/json"});
    var output = {error:null,data:data};
    res.end(JSON.stringify(output)+"\n");
};

/*请求失败*/
exports.send_failure = function(res, code, err) {
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
};


exports.error_for_resp = function (err) {
    if (!(err instanceof Error)) {
        console.error("** Unexpected error type! :" + err.constructor.name);
        return JSON.stringify(err);
    } else {
        var code = err.code ? err.code : err.name;
        return JSON.stringify({ error: code,
                                message: err.message });
    }
};

exports.error = function (code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
};

exports.is_image = function (filename) {
    switch (path.extname(filename).toLowerCase()) {
      case '.jpg':  case '.jpeg': case '.png':  case '.bmp':
      case '.gif':  case '.tif':  case '.tiff':
        return true;
    }
    return false;
};

exports.missing_data = function (what) {
    return exports.error("missing_data",
                         "You must include " + what);
};

exports.invalid_resource = function() {
    return { error: "invalid_resource",
             message: "the requested resource does not exist." };
};

exports.not_image = function () {
    return exports.error("not_image_file",
                         "The uploaded file must be an image file.");
};

exports.no_such_album = function() {
    return { error: "no_such_album",
             message: "The specified album does not exist" };
};

exports.http_code_for_error = function (err) {
    switch (err.message) {
      case "no_such_album":
        return 403;
      case "invalid_resource":
        return 404;
    }
    return 503;
};

exports.valid_filename = function (fn) {
    var re = /[^\.a-zA-Z0-9_-]/;
    return typeof fn == 'string' && fn.length > 0 && !(fn.match(re));
};

exports.file_error = function (err) {
    return exports.error("file_error", JSON.stringify(err));
};