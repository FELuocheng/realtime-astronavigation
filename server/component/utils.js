/**
 * Created by lenovo on 2016/12/22.
 */
module.exports={
    ObjVals2Arr:function(obj){
        var arr = [];
        for(var item in obj){
            arr.push(obj[item]);
        }
        return arr;
    },
    random:function (Min,Max) {
        return Min + (Max - Min)* Math.random();
    },
    between: function (num , min , max) {
        if(num<min)num=min;
        if(num>max)num=max;
        return num
    },
    locateInCamera : function (cam,el) {
        var clone = Object.assign({}, el);
        clone["dx"] = el.x - cam.x;
        clone["dy"] = el.y - cam.y;
        return clone;
    },
    hitTestRectArc:function(rect,circle){
        var rw = rect.bWidth
            ,rh = rect.bHeight
            ,rx = rect.xMin
            ,ry = rect.yMin
            ,cx = circle.x
            ,cy = circle.y,
            r=circle.width/2,
            rcx = rx+rw*0.5,
            rcy = ry+rh*0.5;
            var dx = Math.abs(cx-rcx),dy = Math.abs(cy-rcy)
            if(dx <= r+rw/2 &&dy <= r+rh/2){
                var ret;
                var angle=Math.atan2(dy,dx);
                var hx=Math.cos(angle)*r,hy=Math.sin(angle)*r;
                //撞在陨石右上角
                if(cx<=rcx&&cy>=rcy)ret=[cx+hx,cy-hy]
                //撞在陨石左上角
                if(cx>=rcx&&cy>=rcy)ret=[cx-hx,cy-hy]
                //撞在陨石左下角
                if(cx>=rcx&&cy<=rcy)ret=[cx-hx,cy+hy]
                //撞在陨石右下角
                if(cx<=rcx&&cy<=rcy)ret=[cx+hx,cy+hy]
                return ret;
            }
            return false;
    }
}