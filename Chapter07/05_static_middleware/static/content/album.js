/*相册页面加载器 album.js*/

$(function() {
    var tmpl;       //HTML框架
    var tdata = {}; //填充HTML内的json 数据

    //初始化页面
    var initPage = function() {

        var parts = window.location.href.split("/");
        var album_name = parts[5];
        //加载HTML模板
        $.get('/templates/album.html', function(data) {
            tmpl = data;
        });


        $.getJSON("/v1/albums/"+album_name+".json", function(d) {

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

    var af = d.data.album_data;

    for (var i = 0; i < af.photos.length; i++) {
        var url = "http://localhost:8080/albums/" + af.short_name + "/" + af.photos[i].filename;
        obj.photos.push({ url: url, desc: af.photos[i].filename });
    }
    return obj;
}