/*帮助模块*/

exports.version = '0.1.0';

/*请求成功*/
exports.send_success = function(res, data){
    res.writeHead(200,{"Content-Type" : "applicathon/json"});
    var output = {error:null,data:data};
    res.end(JSON.stringify(output)+"\n");
};

/*请求失败*/
exports.send_failure = function(res, server_code, err) {
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
};



exports.invalid_resource = function() {
    return { error: "invalid_resource",
             message: "the requested resource does not exist." };
};


exports.no_such_album = function() {
    return { error: "no_such_album",
             message: "The specified album does not exist" };
};