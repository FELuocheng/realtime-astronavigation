/**
 * Created by lenovo on 2016/12/22.
 */
(function ($) {
    var shipImg = new Image();
    var rockImg = new Image();
    var blackInImg = new Image(),blackOutImg = new Image();
    var G=window.GAME;
    const img_path='./assets/'
    //飞船图片
    const ship_img_path = './assets/ship/';
    //表情包
    const exp_img_path='./assets/expression/';
    //陨石图片
    const rock_img_path='./assets/rock/'
    //表情前缀
    var use_em=function (str) {
        return "(em#"+str+")"
    }
    //修复字体bug
    var isWindowRize=false;
    window.onresize=function(){
        isWindowRize=true;
    }
    //对话框
    var Dialog=(function () {
        function Dialog(x,y,msg) {
            this.x=x;
            this.y=y;
            this.msg=msg;
            this.topMargin=15;
            this.leftMargin=6;
            this.maxWidth=120;
            this.fontSize=16;
            this.imgHeight=30;
            this.imgWidth=30;
            this.rowHeight=max(this.fontSize,this.imgHeight);
        }
        Dialog.prototype.drawText=function (txt,ctx,maxFont) {
            var row=ceil(txt.length/maxFont);
            var ct=0;
            for (var r = 0; r < row; r++) {
                var t
                if (r == row - 1) {
                    t=txt.substr(ct)
                    ctx.fillTextNew(t, this.leftMargin, this.topMargin + this.rowHeight * r, this.maxWidth, t.length*this.fontSize/2);
                }
                else {
                    t=txt.substring(ct, ct += maxFont)
                    ctx.fillTextNew(t, this.leftMargin, this.topMargin + this.rowHeight * r, this.maxWidth, maxFont*this.fontSize/2);
                }
            }
        }
        Dialog.prototype.drawTextAndEmoji=function(txts,ems,ctx,maxFont){
            var txl = txts.length
            //起始位置
            var offsetX=this.leftMargin,offsetY=this.topMargin,txt,em;
            var row=0;
            for (var i = 0; i < txl; i++) {
                //先写字
                txt=txts[i];
                if(txt!=""){
                    //第一行最多能写字数
                    let ffm=floor((this.maxWidth-offsetX)/this.fontSize)
                    //第一行写不满
                    if(txt.length<ffm){
                        ctx.fillTextNew(txt,offsetX,this.topMargin + this.rowHeight * row, this.maxWidth,txt.length*this.fontSize/2);
                        offsetX+=txt.length*this.fontSize;
                    }
                    //第一行写得满
                    else {
                        let ct=0;
                        var t=txt.substring(0,ct += ffm);
                        ctx.fillTextNew(t,offsetX,this.topMargin + this.rowHeight * row, this.maxWidth, t.length*this.fontSize/2);
                        row++;
                        let tr=ceil((txt.length-ffm)/maxFont)+row;
                        for (let r = row; r < tr; r++) {
                            //最后一行
                            if(r==tr-1){
                                t=txt.substr(ct);
                                ctx.fillTextNew(t, this.leftMargin, this.topMargin + this.rowHeight * r, this.maxWidth, t.length*this.fontSize/2);
                                offsetX=this.leftMargin+t.length*this.fontSize
                            }
                            else {
                                t=txt.substring(ct, ct += maxFont)
                                ctx.fillTextNew(t, this.leftMargin, this.topMargin + this.rowHeight * r, this.maxWidth, t.length*this.fontSize/2);
                                row++;
                            }
                        }
                    }
                }
                //画表情
                if(i!=txl-1){
                    em=ems[i];
                    if((this.maxWidth-offsetX)<this.imgWidth){
                        row++;
                        offsetX=this.leftMargin;
                    }
                    var emImg = new Image();
                    emImg.src = exp_img_path + em.replace(/\(|\)|em#/g, "") + ".png";
                    ctx.drawImage(emImg, offsetX, this.rowHeight*row, this.imgWidth, this.imgHeight);
                    offsetX+=this.imgWidth;
                }
            }
        }
        Dialog.prototype.draw=function (ctx) {
            if (this.msg && this.msg != "") {
                ctx.save();
                ctx.translate(this.x, this.y);
                var msg = this.msg;
                //分离出表情信息和字符串信息
                var ms, ts;
                ms = msg.match(/\(em#.*?\)/g);

                var width, height, dl, row;
                if (ms === null || void 0)dl = msg.length * (this.fontSize) + 30;
                else {
                    ts = msg.split(/\(em#.*?\)/);
                    dl = ts.join("").length * (this.fontSize) + ms.length * 30+30
                }
                width = dl <= this.maxWidth ? dl : this.maxWidth;
                row = ceil(dl / this.maxWidth);
                height = row * this.rowHeight+this.topMargin
                //画对话框
                drawRoundedRect(ctx, "white", 0, 0, width, height, 10);
                ctx.moveTo(width / 2.5, height);
                ctx.lineTo(-10, 60);
                ctx.lineTo(width / 4, height);
                ctx.closePath();
                ctx.fill();
                //画对话框内容
                ctx.beginPath();
                ctx.fillStyle = "#000000"
                ctx.font = "" + this.fontSize + "px Arial"
                /*纯文字*/
                var maxFont=floor((this.maxWidth-this.leftMargin)/this.fontSize)
                if (ms === null || void 0) {
                    this.drawText(msg, ctx, maxFont);
                }
                /*含表情*/
                else {
                   this.drawTextAndEmoji(ts,ms,ctx,maxFont)
                }
                ctx.restore();
            }
        }
        return Dialog
    })()
        var drawRoundedRect=function(ctx,fillStyle,cornerX,cornerY,width,height,cornerRadius) {
            ctx.beginPath();
            if (width> 0) ctx.moveTo(cornerX + cornerRadius, cornerY);
            else  ctx.moveTo(cornerX - cornerRadius, cornerY);
            ctx.arcTo(cornerX+width,cornerY,cornerX + width,cornerY+height,cornerRadius);
            ctx.arcTo(cornerX+width,cornerY + height,cornerX,cornerY+height,cornerRadius);
            ctx.arcTo(cornerX,cornerY+height,cornerX,cornerY,cornerRadius);
            if(width> 0) {
                ctx.arcTo(cornerX,cornerY,cornerX+cornerRadius,cornerY,cornerRadius);
            }
            else{
                ctx.arcTo(cornerX,cornerY,cornerX-cornerRadius,cornerY,cornerRadius);
            }
            ctx.fillStyle = fillStyle;
            ctx.fill();
    }
    BalckHoleUtil = {
        draw:function (ctx) {
            var bla = ctx.black_hole;
            if (!$.isEmptyObject(bla)) {
                ctx.save();
                ctx.translate(bla.dx, bla.dy);
                ctx.rotate(bla.outRotation);
                blackOutImg.src=img_path+"black_hole_out.png"
                ctx.drawImage(blackOutImg, -bla.outRadius, -bla.outRadius);
                ctx.restore();
                ctx.save();
                ctx.translate(bla.dx, bla.dy);
                ctx.rotate(bla.inRotation);
                blackInImg.src=img_path+"black_hole_in.png"
                ctx.drawImage(blackInImg, -bla.inRadius, -bla.inRadius);
                ctx.restore();
            }
        }
    }
    RockUtil = {
        draw:function (ctx) {
            ctx.rocks.forEach(function (rock) {
                ctx.save();
                ctx.translate(rock.dx, rock.dy);
                rockImg.src=rock_img_path+"rock"+rock.level+".png"
                ctx.drawImage(rockImg, -rock.width / 2, -rock.height / 2, rock.width, rock.height);
                ctx.restore();
            })
        }
    }
    CoinUtil = {
        draw:function (ctx) {
            ctx.coins.forEach(function (coin) {
                if (!coin.collected) {
                    ctx.save();
                    ctx.translate(coin.dx, coin.dy);
                    ctx.scale(coin.xScale, 1);
                    ctx.beginPath();
                    ctx.arc(0, 0, (coin.radius < 0 ? 0 : coin.radius), 0, TWO_PI, false);
                    if (coin.magnetized) {
                        ctx.fillStyle = 'hsla(0, 0%, ' + (coin.xScale * 140) + '%, ' + coin.alpha + ')';
                    } else {
                        ctx.fillStyle = 'hsla(' + ctx.hue + ', 100%, ' + (coin.xScale * 70) + '%, ' + coin.alpha + ')';
                    }
                    ctx.fill();
                    return ctx.restore();
                } else {
                    ctx.fillStyle = 'hsla(0, 0%, 0%, ' + (coin.alpha < 0 ? 0 : coin.alpha) + ')';
                    ctx.fillText('+' + coin.value, coin.dx, coin.dy + 1);
                    ctx.fillStyle = 'hsla(' + ctx.hue + ', 100%, 60%, ' + (coin.alpha < 0 ? 0 : coin.alpha) + ')';
                    return ctx.fillText('+' + coin.value, coin.dx, coin.dy);
                }
            })
        }
    }
    ShipUtil={
        draw:function (ctx) {
            var ships=ctx.ships;
            for(var sh in ships){
                var ship=ships[sh];
                //获取分数
                if(sh==G.id){
                    ctx.profit=ship.profit;
                }
                //画对话框
                ctx.save();
                if(ship.inhole) {
                    new Dialog(ship.dx + ship.bWidth + 5, ship.dy - ship.height / 2, "啊!(em#fanle2)啊!!").draw(ctx)
                }
                if(ship.outhole){
                    new Dialog(ship.dx + ship.bWidth+5, ship.dy-ship.height / 2, "乌拉拉~(em#wulala)").draw(ctx)
                }
                ctx.restore();
                ctx.save();
                ctx.translate(ship.dx + ship.width / 2, ship.dy + ship.height / 2);
                ctx.rotate(ship.rotation);
                shipImg.src=ship_img_path+'rocket'+ship.level+".png"
                ctx.drawImage(shipImg, -ship.width / 2, -ship.height / 2,ship.width,ship.height);
                if (ship.thrust) {
                    ctx.beginPath();
                    ctx.arc(-ship.width / 2, 3, random(1, ship.height/2), 0, TWO_PI);
                    ctx.fillStyle = 'hsla(' + random(0, 60) + ', 100%, ' + random(60, 80) + '%, 1)';
                    ctx.fill();
                }
                //画血条
                ctx.beginPath();
                ctx.strokeStyle="#2ED939";
                ctx.lineWidth=3;/*边框的宽度*/
                ctx.strokeRect(-ship.width / 2,-ship.height,ship.width,10);
                ctx.fillStyle='red';
                ctx.rect(-ship.width / 2+3,-ship.height+3,ship.width*(ship.health/100)-6,4)
                ctx.fill();
                ctx.restore();
                //画名字
                ctx.save();
                ctx.beginPath();
                ctx.font="18px Arial"
                ctx.fillStyle='#ffffff';
                ctx.fillText(ship.username, ship.dx+(ship.bWidth-ship.username.length)/2, ship.dy+ship.bHeight+10);
                ctx.fill();
                ctx.restore();
                //画消息
                if(ship.msg)new Dialog(ship.dx + ship.bWidth + 5, ship.dy - ship.height / 2,ship.msg).draw(ctx)
            }
        }
    }
    //特效笔盒
    EffectUtil={
        //绘制撞击特效
        drawHit:function (ctx) {
            ctx.hits.forEach(function (hit) {
                ctx.save();
                ctx.beginPath();
                ctx.translate(hit.dx,hit.dy);
                var star=new Image();
                star.src="./assets/spark.png"
                ctx.drawImage(star,0,0,30,30);
                ctx.restore();
            })
        }
    }
    /*登录成功后加载动画*/
    G.setup = function() {
        return Sketch.create({
            setup: function() {
                this.profit=0;
                this.profitDisplayVal = 0;
                this.profitDisplay = $('.profit span');
                this.hue = 60;
                this.ndt = 1;
                this.coins = [];
                this.rocks = [];
                this.hits = [];

                this.ships = {};
                this.ship={};
                this.black_hole={};
                console.log("屏幕高:"+this.height+"宽"+this.width)
                this.numberWithCommas = function(x) {
                    x = Math.round(x);
                    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                };
                /*修复canvas窗口大小变化后字体位置平移的BUG
                发现一个filltext的BUG,绘制的x,y是字体中心坐标，而不是左上角坐标
                而窗口尺寸改变后成了左上角坐标*/
                this.fillTextNew=function (text,x,y,maxWidth,HorizonOffset) {
                    if(isWindowRize)this.fillText(text,x,y,maxWidth)
                    else this.fillText(text,x+HorizonOffset,y,maxWidth)
                }
                this.font = 'bold 14px arial';
                this.textAlign = 'center';
                // this.boundingBoxCheck = $('.bounding-box');
                // this.showBoundingBox = false;
                // this.boundingBoxCheck.on('change', function() {
                //   return self.showBoundingBox = $(this).is(':checked');
                // });
                //监听游戏数据
                G.res_game_data(this);
                G.setup_data(this);
            },
            clear: function() {
                this.clearRect(0, 0, this.width, this.height);
                return G.req_game_data(this);
            },
            update: function() {
                this.ndt = this.dt / 16;
                this.hue += 0.75;
                //监听用户操作并发送
                G.move(this)
                return this.profitDisplayVal += (this.profit - this.profitDisplayVal) * 0.1;
            },
            draw: function() {
                // if (this.showBoundingBox) {
                //     this.ship.drawBoundingBox(this);
                //     this.ship.drawCorners(this);
                // }
                BalckHoleUtil.draw(this);
                RockUtil.draw(this);
                ShipUtil.draw(this);
                CoinUtil.draw(this);
                EffectUtil.drawHit(this);
                return this.profitDisplay.text(this.numberWithCommas(this.profitDisplayVal));
            }
        });
    };
})("function" == typeof jQuery?jQuery:{fn:{}})