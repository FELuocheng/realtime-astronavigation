/**
 * Created by lenovo on 2016/12/22.
 */
(function ($) {
    //实现左侧窗体动画
    $.fn.leftBtnAnimate=function(obj) {
        var $btn = this;
        var $chat = obj.target;
        this.click(function () {
            //切换样式
            $btn.toggleClass(obj.toggleClass);
            $chat.animate({
                marginLeft: parseInt($chat.css('marginLeft'), 10) == 0 ? '-20%' : 0
            });
            $btn.animate({
                left: parseInt($btn.css('left'), 10) == 0 ? '20%' : 0,
            })
        });
    }
})("function" == typeof jQuery?jQuery:{fn:{}})