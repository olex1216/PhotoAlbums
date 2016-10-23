/*  相册列表服务器--检测文件夹*/
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
            var only_dirs = [];//存放文件夹
            // 检测是否为文件夹
            (function test_files(index) {
                //检测结束
                if (index == files.length) {
                    callback(null,only_dirs);
                }

                fs.stat(
                    "albums/"+files[index],
                    function(err,stats) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (stats.isDirectory()) {
                            only_dirs.push(files[index]);
                        }
                        test_files(index+1);
                    }
                );
            })(0);
        }
    );
}

function handle_incoming_request(req,res) {
    console.log("INCOMING REQUEST: "+req.method+" "+req.url);
    load_album_list(function(err,albums) {
        if (err) {
            res.writeHead(503,{"Content-Type" : "applicathon/json"});
            res.end(JSON.stringify(err)+"\n");
            return;
        }

        var out = {error:null,
                   data:{albums:albums}};
        res.writeHead(200,{"Content-Type" : "applicathon/json"});
        res.end(JSON.stringify(out)+"\n");
    });
}

var s = http.createServer(handle_incoming_request);
s.listen(8080);