/*添加照片页面的加载器*/

$(function() {
    var tmpl;
    var tdata = {};

    //初始化页面
    var initPage = function() {
        $.get('/templates/admin_add_photo.html', function(data) {
            tmpl = data;
        });

        $.getJSON('/v1/albums.json', function(d) {
            $.extend(tdata,d.data);
        });

        $(document).ajaxStop(function() {
            var renderedPage = Mustache.to_html( tmpl,tdata);
            $("body").html(renderedPage);
        });
    }();
});