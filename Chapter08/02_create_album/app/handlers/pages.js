/*页面模块*/
var helpers = require('./helpers.js');
var fs = require('fs');

exports.version = "0.1.0";

exports.generate = function (req, res) {
    var page = req.params.page_name;

    /*创建新相册或添加新照片的请求*/
    if (req.params.sub_page && req.params.page_name == 'admin'){
        page = req.params.page_name + "_" + req.params.sub_page;
    }

    fs.readFile(
        'basic.html',
        function (err, contents) {
            if (err) {
                helpers.send_failure(res, 500, err);
                return;
            }

            contents = contents.toString('utf8');

            // replace page name, and then dump to output.
            contents = contents.replace('{{PAGE_NAME}}', page);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(contents);
        }
    );
};