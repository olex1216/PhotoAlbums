/*首页加载器 home.js*/

$(function() {
    var tmpl;       //HTML框架
    var tdata = {}; //填充HTML内的json 数据

    //初始化页面
    var initPage = function() {
        //加载HTML模板
        $.get('/templates/home.html', function(data) {
            tmpl = data;
        });

        $.getJSON('/albums.json', function(d) {
            $.extend(tdata,d.data);
        });

        $(document).ajaxStop(function() {
            var renderedPage = Mustache.to_html(tmpl,tdata);
            $('body').html(renderedPage);
        });

    }();
});