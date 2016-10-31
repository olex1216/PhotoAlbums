/*相册页面加载器 album.js*/

$(function() {
    var tmpl;       //HTML框架
    var tdata = {}; //填充HTML内的json 数据

    //初始化页面
    var initPage = function() {

        // get our album name.
        var re = "/pages/album/([a-zA-Z0-9_-]+)";

        var results = new RegExp(re).exec(window.location.href);

        var album_name = results[1];//相册名


        //加载HTML模板
        $.get('/templates/album.html', function(data) {
            tmpl = data;
        });

        var p = $.urlParam("page");
        var ps = $.urlParam("page_size");
        if (p < 0) p = 0;
        if (ps <= 0) ps = 1000;

        var qs = "?page=" + p + "&page_size=" + ps;
        var url = "/v1/albums/" + album_name + "/photos.json";

        $.getJSON(url, function(d) {
            var photo_d = massage_album(d);
            $.extend(tdata,photo_d);
        });

        $(document).ajaxStop(function() {
            var renderedPage = Mustache.to_html(tmpl,tdata);
            $('body').html(renderedPage);
        });
    }();
});

function massage_album(d) {
    if (d.error !== null) {
        return d;
    }
    var obj = { photos: [] };

    var p = d.data.photos;
    var a = d.data.album_data;

    for (var i = 0; i < p.length; i++) {
        var url = "/albums/" + a.name + "/" + p[i].filename;
        obj.photos.push({ url: url, desc: p[i].description });
    }

    if (obj.photos.length > 0) obj.has_photos = obj.photos.length;
    return obj;
}


//获取查询参数
$.urlParam = function(name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results)
    {
        return 0;
    }
    return results[1] || 0;
};