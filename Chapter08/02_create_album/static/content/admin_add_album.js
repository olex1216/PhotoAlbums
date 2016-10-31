/*创建相册页面的加载器*/

$(function() {
    var tmpl;//HTML模板
    var tdata = {};

    //初始化页面
    var initPage = function() {
        /*加载HTML模板*/
        $.get('/templates/admin_add_album.html', function(data) {
            tmpl = data;
        });

        $(document).ajaxStop(function() {
            var renderedPage = Mustache.to_html(tmpl,tdata);
            $('body').html(renderedPage);
        });

    }();
});