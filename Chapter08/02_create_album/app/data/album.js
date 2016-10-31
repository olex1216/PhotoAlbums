/*后端数据库--创建新相册、添加新照片*/

var fs = require('fs'),
    crypto = require("crypto"),
    local = require('../local.config.js'),
    db = require('./db.js'),
    path = require("path"),
    async = require('async'),
    backhelp = require("./backend_helpers.js");

exports.version = "0.1.0";

/*创建新相册*/
exports.create_album = function(data,callback) {
    var final_album;//最终创建的相册
    var write_succeeded = false;

    async.waterfall([

        // 1.validate data.
        function(cb) {
            try {
                /*1-1确认字段是否存在*/
                backhelp.verify(data,[ "name", "title","date","description" ]);
                /*1-2确认文件名是否有效*/
                if (!backhelp.valid_filename(data.name)) {
                    throw invalid_album_name();
                }
            } catch(e) {
                cb(e);
                return;
            }
            cb(null,data);
        },

        //2.create the album in mongo.
        function(album_data,cb) {
            var write = JSON.parse(JSON.stringify(album_data));//复制对象
            write._id = album_data.name;//相册的_id
            db.albums.insert(write,{ w: 1, safe: true }, cb);//插入新相册
        },

        //3. make sure the folder exists.
        function(new_album,cb) {
            write_succeeded = true;
            final_album = new_album[0];//插入的新相册
            //创建文件夹
            fs.mkdir(local.config.static_content + "albums/" + data.name, cb);
        }
    ],
    function(err,results) {
        // convert file errors to something we like.
        if (err) {
            if (write_succeeded) {
                db.albums.remove({ _id: data.name }, function () {});
            }
            if (err instanceof Error & err.code == 11000 ) {
                callback(backhelp.album_already_exists());
            }
            else if (err instanceof Error & err.errno !== undefined) {
                callback(backhelp.file_error(err));
            } else {
                callback(err);
            }
        } else {
            callback(err, err ? null : final_album);
        }

    });
};

/*查询相册*/
exports.album_by_name = function(name,callback) {
    db.albums.find( { _id : name }).toArray(function(err,results) {
        if (err) {
            callback(err);

            return;
        }

        if (results.length === 0) {
            callback(null, null);//没有该相册
        } else if (results.length == 1) {

            callback(null, results[0]);//查询成功
        } else {
            console.error("More than one album named: " + name);
            console.error(results);
            callback(backhelp.db_error());
        }
    });
};

/*相册列表*/
exports.all_albums = function(sort_field,sort_desc,skip,count,callback) {
    var sort = {};

    sort[sort_field] = sort_desc ? -1 : 1;
    db.albums.find()
        .sort(sort)
        .skip(skip)
        .limit(count)
        .toArray(callback);
};

/*获取相册中的照片*/
exports.photos_for_album = function(album_name,pn,ps,callback) {
    var sort = { date : -1 };
    db.photos.find({albumid: album_name})
        .skip(pn)
        .limit(ps)
        .sort("date")
        .toArray(callback);
};



/*向相册中添加照片*/
exports.add_photo = function( photo_data, path_to_photo, callback ) {
    var final_photo;
    var base_fn = path.basename(path_to_photo).toLowerCase();
    async.waterfall([

        //1. validate data
        function(cb) {
            try {
                /*1-1确认字段是否存在*/
                backhelp.verify(photo_data,["albumid","description","date"]);
                photo_data.filename =  base_fn;//照片名
                /*1-2确认相册名是否有效*/
                if (!backhelp.valid_filename(photo_data.albumid)) {
                    throw invalid_album_name();
                }
            } catch (e) {
                cb(e);
            }
            cb(null,photo_data);
        },

        //2. add the photo to the collection
        function(pd,cb) {
            pd._id = pd.albumid + "_" + pd.filename;//照片的_id
            db.photos.insert(pd,{w:1,safe: true},cb);//插入新照片
        },

        // now copy the temp file to static content
        function(new_photo,cb) {
            final_photo = new_photo[0];
            var save_path = local.config.static_content + "albums/" + photo_data.albumid + "/" + base_fn;
            backhelp.file_copy(path_to_photo, save_path, true, cb);
        }
    ],
    function(err,results) {
        // convert file errors to something we like.
        if (err && err instanceof Error && err.errno !== undefined) {
            callback(backhelp.file_error(err));
        } else {
            callback(err, err ? null : final_photo);
        }
    });
};

/*无效的相册名*/
function invalid_album_name() {
    return backhelp.error("invalid_album_name",
                          "Album names can have letters, #s, _ and, -");
}

/*无效的文件名*/
function invalid_filename() {
    return backhelp.error("invalid_filename",
                          "Filenames can have letters, #s, _ and, -");
}

