/*Code-4.1  相册列表服务器*/
var http = require('http');
var fs = require('fs');

//加载相册文件列表
function load_album_list(callback) {
    fs.readdir(
        "albums",
        function(err,files) {
            if (err) {
                callback(err);
                return;
            }
            callback(null,files);
        }
    );
}

function handle_incoming_request(req,res) {
    console.log("INCOMING REQUEST: "+req.method+" "+req.url);
    load_album_list(function(err,albums) {
        //处理错误
        if (err) {
            res.writeHead(503,{"Content-Type" : "applicathon/json"});
            res.end(JSON.stringify(err)+"\n");
            return;
        }
        //返回结果
        var out = {error:null,
                   data:{albums:albums}};
        res.writeHead(200,{"Content-Type" : "applicathon/json"});
        res.end(JSON.stringify(out)+"\n");
    });
}

var s = http.createServer(handle_incoming_request);
s.listen(8080);