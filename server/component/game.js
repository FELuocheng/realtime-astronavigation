"use strict"
var utils=require('./utils.js')
var ship_imgs = new Map()
    .set(1,{width:117,height:58})
    .set(2,{width:109,height:61})
    .set(3,{width:119,height:70})
    .set(4,{width:132,height:64});
var rock_imgs = new Map()
    .set(1,{width:156,height:156})
//基本元素
var Element=function (x,y,width,height) {
    this.x=x;
    this.y=y;
    this.width=width;
    this.height=height;
}
//存储画布的信息
var Context=(function () {
    function Context(){
        this.width=5000;
        this.height=5000;
        this.magnetRange = 250;
        this.hue = 60;
        this.ndt = 1;
        //金币
        this.coins = [];
        //飞船
        this.ships = {};
        //陨石
        this.rocks = [];
        //撞击点
        this.hits = [];
        //黑洞
        this.black_holes = [new BlackHole(2000,2000,true),new BlackHole(4000,4000,false)];
        // this.font = 'bold 14px arial';
        // this.textAlign = 'center';
        var self = this;
        setInterval(function() {
            if(self.coins.length<1000)self.coins.push(new Coin(utils.random(0,self.width), utils.random(0,self.height),Math.floor(utils.random(1, 100))));
        }, 200);
        setInterval(function() {
            if(self.rocks.length<8)self.rocks.push(new Rock(utils.random(0,self.width), utils.random(0,self.height),1));
        }, 500);
    };
    Context.prototype.update=function (socket) {
        var self=this;
        //记录下用户的火箭
        socket.on('setup_canvas',function (data) {
            var camera=new Camera(utils.random(0,self.width-data.width), utils.random(0,self.height-data.height),data.width,data.height)
            var ship=camera.initCenterShip(data.username)
            self.ships[data.id]=ship
            camera.lookAt(self)
            socket.emit('game_data',camera)
            // self.cameras[data.id]=camera
        });
        //监听用户的操作
        socket.on('move',function (data) {
            var msh=self.ships[data.id];
            if(msh){
                msh.update(data,self)
            }
        });
        //发送数据
        socket.on('game_data',function (data) {
            var id,cam,ship,w,h;
            id=data.id;
            w=data.width;
            h=data.height;
            ship=self.ships[id];
            var cx,cy;
            cx=ship.xMin-(w-ship.bWidth)/2;
            cy=ship.yMin-(h-ship.bHeight)/2;
            cx=utils.between(cx,0,self.width-w)
            cy=utils.between(cy,0,self.height-h)
            cam = new Camera(cx,cy,w,h);
            cam.lookAt(self);
            socket.emit('game_data', cam);
        });
        return setInterval(function () {
            self.hue += 0.75;
            //金币动画
            var i=self.coins.length;
            while (i--){
                self.coins[i].update(self,i)
            }
            i=self.rocks.length;
            while (i--){
                self.rocks[i].update(self);
            }
            i=self.black_holes.length;
            while (i--){
                self.black_holes[i].update(self);
            }
            for(var s in self.ships){
                var ship=self.ships[s];
                if(ship.msgTime!=0&&(new Date-ship.msgTime)>=ship.msgLife){
                    ship.msg=null;
                    ship.msgTime=0;
                }
            }
        },16.6)
    }
    return Context;
})();
//镜头
var Camera = (function () {
    function Camera(x,y,width,height) {
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        //镜头中的火箭
        this.ships={}
        //镜头中的金币
        this.coins=[]
        //镜头中的陨石
        this.rocks = []
        //镜头中的黑洞
        this.black_hole = {}
        //撞击点
        this.hits=[]
    }
    //自己的火箭初始位于镜头的中央
    Camera.prototype.initCenterShip = function (username) {
        return new Ship(this,username);
    }
    //改变镜头的坐标
    Camera.prototype.lookAt = function (ctx) {
        var coins,ships,rocks,hits,self=this;
        var top=this.y,bottom=this.y+this.height;
        var left=this.x,right=this.x+this.width;
        coins=ctx.coins;
        coins.forEach(function (coin) {
            if(coin.x>left && coin.x<right
                && coin.y>top && coin.y<bottom){
                self.coins.push(utils.locateInCamera(self,coin))
            }
        })
        rocks=ctx.rocks;
        rocks.forEach(function (rock) {
            if(rock.x+rock.halfWidth>left && rock.x-rock.halfWidth<right
                && rock.y+rock.halfHeight>top && rock.y-rock.halfHeight<bottom){
                self.rocks.push(utils.locateInCamera(self,rock))
            }
        })
        ships=ctx.ships;
        for(let k in ships){
            var ship=ships[k];
            if(ship.xMin && ship.xMin+ship.bWidth/2>left && ship.xMin-ship.bWidth/2<right
                && ship.yMin &&ship.yMin+ship.bHeight/2>top && ship.yMin-ship.bHeight/2<bottom){
                self.ships[k]=utils.locateInCamera(self,ship)
            }
        }
        ctx.black_holes.forEach(function (bla) {
            if(bla.x+bla.outRadius >left && bla.x-bla.outRadius<right && bla.y+bla.outRadius>top && bla.y-bla.outRadius<bottom){
                self.black_hole=utils.locateInCamera(self,bla)
            }
        })
        hits=ctx.hits;
        hits.forEach(function (hit) {
            if(hit.x+hit.radius >left && hit.x-hit.radius<right && hit.y+hit.radius>top && hit.y-hit.radius<bottom){
                self.hits.push(utils.locateInCamera(self,hit))
            }
        })
    }
    return Camera
})()
//陨石
var Rock =  (function () {
    function Rock(x,y,level) {
        this.x=x;
        this.y=y;
        this.level=level;
        this.width=rock_imgs.get(level).width;
        this.height=rock_imgs.get(level).height;
        this.halfWidth=this.width/2;
        this.halfHeight=this.height/2;
        this.hit=false;
        this.catch=false;
    }
    Rock.prototype.update=function(ctx){
        for(let sh in ctx.ships){
            let ship=ctx.ships[sh];
            let hit_point=utils.hitTestRectArc(ship,this);
            if (!this.hit&&hit_point) {
                // this.hit=true;
                ship.hit=true;
                ctx.hits.push(new Hit(hit_point[0],hit_point[1]));
            }
        }
    }
    return Rock
})()
//黑洞
var BlackHole = (function () {
    function BlackHole(x,y,isBlack) {
        this.x=x;
        this.y=y;
        this.outRadius=559/2;
        this.inRadius=204/2;
        this.isBlack=isBlack;
        //引力场范围
        this.gravitationRange = 500;
        this.inRotaionSpeed = 0.003;
        this.outRotationSpeed = 0.002;
        this.inRotation = 0;
        this.outRotation = 0;
    }
    BlackHole.prototype.update=function (ctx) {
        if(this.isBlack){
        	this.inRotation+=this.inRotaionSpeed;
        	this.outRotation+=this.outRotationSpeed;
        }
        else {
        	this.inRotation-=this.inRotaionSpeed;
        	this.outRotation-=this.outRotationSpeed;
        }
        //黑洞吸引&白洞排斥的物理效果
        var rocks,ships,anotherHole;
        rocks=ctx.rocks;
        ships=ctx.ships;
        anotherHole=(ctx.black_holes[0].isBlack!=this.isBlack)?ctx.black_holes[0]:ctx.black_holes[1];
        var self=this;
        rocks.forEach(function (rock) {
            var dx,dy,dist,angle,mvx,mvy,power
            dx = rock.x + rock.width / 2 - self.x;
            dy = rock.y + rock.height / 2 - self.y;
            //环绕半径
            dist = Math.sqrt(dx * dx + dy * dy);
            //环绕角度
            angle = Math.atan2(dy, dx);
            //角速度
            mvx = Math.cos(angle);
            mvy = Math.sin(angle);
            power = 3 + (100 / dist);
            rock.catch=true;
            if (dist <= self.gravitationRange) {
                //黑洞吸引
                if(self.isBlack) {
                    //从白洞中出现
                    if (dist <= 15){
                        rock.x=anotherHole.x;
                        rock.y=anotherHole.y;
                    }
                    //陨石做向心圆周运动
                    else {
                        if (rock.width >15)rock.width -= 0.05 * power;
                        if (rock.height >15)rock.height -= 0.05 * power;
                        rock.x -= (mvx * power);
                        rock.y -= (mvy * power);
                    }
                }
                //白洞排斥
                else{
                    //陨石做离心圆周运动
                    if (rock.width <= rock_imgs.get(rock.level).width)rock.width += 0.05 * power;
                    if (rock.height <= rock_imgs.get(rock.level).height)rock.height += 0.05 * power;
                    rock.x += (mvx * power);
                    rock.y += (mvy * power);
                }
            }
            else {
                rock.catch=false;
                rock.rotation=0;
                rock.rotationSpeed=0;
                rock.rotationRadius=0;
            }
        })
        for (let s in ships){
            let ship=ships[s];
            var dx,dy,dist,angle,mvx,mvy,power
            dx = ship.x + ship.width / 2 - self.x;
            dy = ship.y + ship.height / 2 - self.y;
            //环绕半径
            dist = Math.sqrt(dx * dx + dy * dy);
            //环绕角度
            angle = Math.atan2(dy, dx);
            //角速度
            mvx = Math.cos(angle);
            mvy = Math.sin(angle);
            power = 1 + (100 / dist);
            if (dist <= self.gravitationRange) {
                ship.canmove=false;
                //黑洞吸引
                if(self.isBlack) {
                    //从白洞中出现
                    if (dist <= 15){
                        ship.x=anotherHole.x;
                        ship.y=anotherHole.y;
                        ship.health-=10;
                        ship.inhole=false;
                    }
                    //陨石做向心圆周运动
                    else {
                        ship.inhole=true;
                        ship.x -= (mvx * power);
                        ship.y -= (mvy * power);
                        if (ship.width >25)ship.width -= ship.width * 0.001 * power;
                        if (ship.height >10)ship.height -= ship.height * 0.001 * power;
                    }
                }
                //白洞排斥
                else{
                    //陨石做离心圆周运动
                    ship.outhole=true;
                    ship.x += (mvx * power);
                    ship.y += (mvy * power);
                    if (ship.width <= ship_imgs.get(ship.level).width)ship.width += ship.width * 0.01 * power;
                    if (ship.height <= ship_imgs.get(ship.level).height)ship.height += ship.height * 0.01 * power;
                }
            }
            else {
                if(!(ship.inhole||ship.outhole))ship.canmove=true;
                if(self.isBlack)ship.inhole=false;
                else ship.outhole=false;
            }
        }
    }
    return BlackHole
})()

var Coin = (function() {
    function Coin(x, y, value) {
        //后台坐标
        this.x = x;
        this.y = y;
        this.vx = utils.random(-0.5, 1);
        this.vy = utils.random(-0.5, 1);
        this.radius = 4;
        this.value = value;
        this.magnetized = false;
        this.xScale = 1;
        this.xScaleGrow = true;
        this.collected = false;
        this.alpha = 0;
        this.cv = 0;
    }

    Coin.prototype.update = function(ctx, i) {
        var scaleChange;
        if (this.alpha < 1 && !this.collected) {
            this.alpha += 0.05 * ctx.ndt;
        }
        if (this.xScaleGrow && this.xScale >= 1) {
            this.xScaleGrow = false;
        } else if (!this.xScaleGrow && this.xScale <= 0.1) {
            this.xScaleGrow = true;
        }
        scaleChange = this.magnetized ? 0.15 : 0.05;
        if (this.xScaleGrow) {
            this.xScale += scaleChange;
        } else {
            this.xScale -= scaleChange;
        }
        if (!this.collected) {
            var self=this;
            (function () {
                var angle, dist, dx, dy, mvx, mvy, power,ship;
                for(var sid in ctx.ships){
                    ship=ctx.ships[sid];
                    dx = ship.x + ship.width / 2 - self.x;
                    dy = ship.y + ship.height / 2 - self.y;
                    dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= ctx.magnetRange) {
                        self.magnetized = true;
                        angle = Math.atan2(dy, dx);
                        mvx = Math.cos(angle);
                        mvy = Math.sin(angle);
                        power = 3 + (100 / dist);
                        self.x += (mvx * power) * ctx.ndt;
                        self.y += (mvy * power) * ctx.ndt;
                    } else {
                        self.magnetized = false;
                        self.x += self.vx * ctx.ndt;
                        self.y += self.vy * ctx.ndt;
                    }
                    if (dist <= Math.sqrt((ship.width * ship.width) + (ship.height * ship.height))/2) {
                        // ship.flashFlag = true;
                        ship.profit += self.value;
                        self.collected = true;
                        self.magnetized = false;
                    }
                }
            })()
        } else {
            this.alpha -= 0.03 * ctx.ndt;
            this.cv += 0.15 * ctx.ndt;
            this.y -= this.cv * ctx.ndt;
        }
        if (this.outOfBounds(ctx)) {
            return ctx.coins.splice(i, 1);
        }
    };

    Coin.prototype.outOfBounds = function(ctx) {
        return this.x > ctx.width + this.radius || this.x < -this.radius || this.y > ctx.height + this.radius || this.y < -this.radius;
    };

    return Coin;

})();
var Ship = (function() {
    function Ship(cam,username) {
        this.level=1;
        this.width = ship_imgs.get(this.level).width;
        this.height = ship_imgs.get(this.level).height;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        //在后台的坐标
        this.x = cam.x+(cam.width-ship_imgs.get(this.level).width)/2;
        this.y = cam.y+(cam.height-ship_imgs.get(this.level).height)/2;
        this.maxLength = Math.max(this.width, this.height);
        this.diagLength = Math.sqrt(this.halfWidth * this.halfWidth + this.halfHeight * this.halfHeight);
        this.rotationSpeed = 0.05;
        this.rotation = 0;
        this.vx = 0;
        this.vy = 0;
        this.thrust = 0;
        //分数
        this.profit=0;
        //昵称
        this.username=username;
        //血量
        this.health=100;
        //碰撞
        this.hit=false;
        //被黑洞吸引
        this.inhole=false;
        //被白洞排斥
        this.outhole=false;

        this.canmove=true;

        //显示聊天消息
        this.msg=null;
        //消息显示五秒后消失
        this.msgTime=0;
        this.msgLife=5000;
    }

    Ship.prototype.update = function(data,ctx) {
        if(this.canmove) {
            var ax, ay;

            if (data.w) {
                this.thrust = 0.15;
            } else {
                this.thrust = 0;
            }
            if (data.d) {
                this.rotation += this.rotationSpeed * ctx.ndt;
            }
            if (data.s) {
                this.vx *= 0.95;
                this.vy *= 0.95;
            }
            if (data.a) {
                this.rotation -= this.rotationSpeed;
            }
        }
        else {
            this.thrust = 0;
        }
        var p=this.profit;
        this.level=(p<2000)&&1||(p>=2000&&p<5000)&&2||(p>=5000&&p<10000)&&3||(p>=10000)&&4
        ax = Math.cos(this.rotation) * this.thrust;
        ay = Math.sin(this.rotation) * this.thrust;
        this.vx += ax;
        this.vy += ay;
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.x += this.vx * ctx.ndt;
        this.y += this.vy * ctx.ndt;
        //如果到达边界
        this.x=utils.between(this.x,10,ctx.width - this.bWidth);
        this.y=utils.between(this.y,28,ctx.height - this.bHeight);
        this.tlx = this.x + (this.width / 2) - Math.cos(-Math.atan2(this.halfHeight, this.halfWidth) - this.rotation) * this.diagLength;
        this.tly = this.y + (this.height / 2) + Math.sin(-Math.atan2(this.halfHeight, this.halfWidth) - this.rotation) * this.diagLength;
        this.trx = this.x + (this.width / 2) - Math.cos(-Math.atan2(this.halfHeight, this.halfWidth) + this.rotation) * -this.diagLength;
        this["try"] = this.y + (this.height / 2) - Math.sin(-Math.atan2(this.halfHeight, this.halfWidth) + this.rotation) * -this.diagLength;
        this.brx = this.x + (this.width / 2) + Math.cos(-Math.atan2(this.halfHeight, this.halfWidth) - this.rotation) * this.diagLength;
        this.bry = this.y + (this.height / 2) - Math.sin(-Math.atan2(this.halfHeight, this.halfWidth) - this.rotation) * this.diagLength;
        this.blx = this.x + (this.width / 2) + Math.cos(-Math.atan2(this.halfHeight, this.halfWidth) + this.rotation) * -this.diagLength;
        this.bly = this.y + (this.height / 2) + Math.sin(-Math.atan2(this.halfHeight, this.halfWidth) + this.rotation) * -this.diagLength;
        this.xMin = Math.min(this.tlx, this.trx, this.brx, this.blx);
        this.xMax = Math.max(this.tlx, this.trx, this.brx, this.blx);
        this.yMin = Math.min(this.tly, this["try"], this.bry, this.bly);
        this.yMax = Math.max(this.tly, this["try"], this.bry, this.bly);
        this.bWidth = this.xMax - this.xMin;
        this.bHeight = this.yMax - this.yMin;
    };

    return Ship;
})();
//聊天信息
var msg=(function () {

})()
//撞击点
var Hit=(function(){
    //火花效果
    function Spark(x,y){

    }
    //爆炸效果
    function Explode(x,y){

    }
    function Hit(x,y){
        this.x=x;
        this.y=y;
        //撞击威力和相撞时速度相关
        this.force=0;
        this.radius=0;
        this.spark=new Spark(x,y);
        this.Explode=new Explode(x,y)
    }
    return Hit;
})()
module.exports={
    ctx:new Context(),
    setup:function(socket) {
        this.ctx.update(socket)
    }
}
