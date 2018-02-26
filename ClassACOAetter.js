var ClassACO=function(){
  this.initial();
}
ClassACO.prototype = {
  startAt:'',
  end : '',
  mode : 0,
  initial_pheromone_value : 0,
  directDistance:0,
  pheromones:[],
  points:[],
}
ClassACO.prototype.initial=function(){
    this.initial_pheromone_value=Math.random()
    this.pheromones=[];
    this.points=[];
}
ClassACO.prototype.removeElement=function (arr){
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
  what = a[--L];
    while ((ax= arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;  // pop a value from a array
}   
ClassACO.prototype.randomTarget = function(ant){
  var index=this.getIndOfPoint(ant.nowAt);
  var dests=[];
  var dest_probs=[];
  var p_sum=0;
  var _thisP = this.pheromones;
  var _this = this;
  _thisP[index].forEach(function(val,ind){
    dests.push(val.dest);
  });   
  ant.trail.forEach(function(text,ind){
    _this.removeElement(dests,text);
  });
  if (!dests.length)return 0; 
  //console.log(ant.preAt);
  dests.forEach(function(val,ind){
    _thisP[index].forEach(function(v,i){
      if(v.dest==val){
        var t={
          dest:v.dest,
          src:v.src,
        };
        var alpha = 1;
        var beta = 0.11;
        var energyInverse = 1
        if(ant.preAt)energyInverse = 0.001/_this.calEnergy(ant.nowAt,v.dest,ant.preAt)
        var property = Math.pow(v.pheromone_val,alpha)*Math.pow(energyInverse,beta);
        t.pheromone_val= property +p_sum;
        dest_probs.push(t);//val=v;
        p_sum+= property ;
      }
    });
  });
  var rand=Math.random()*p_sum;
  for(var d in dest_probs){
    if(dest_probs[d].pheromone_val>rand)return dest_probs[d].dest;
  }
}
ClassACO.prototype.antMove = function(ant){
  var newDest=this.randomTarget(ant);
  var pre = ant.trail.slice(-2)[0];
  if(newDest==0)return 0;  //  went to dead road
  else if(newDest==this.end){  //  to the end
    ant.energy+=this.calEnergy(ant.nowAt,newDest,pre);
    ant.distance+=this.calDistance(ant.nowAt,newDest);
    ant.trail.push(this.end);
    ant.preAt=ant.nowAt;
    ant.nowAt=this.end;
    return ant;
  }
  else {
    ant.energy+=this.calEnergy(ant.nowAt,newDest,pre);
    ant.distance+=this.calDistance(ant.nowAt,newDest);
    ant.trail.push(newDest);
    ant.preAt=ant.nowAt
    ant.nowAt=newDest;
    return this.antMove(ant); 
  };
}
ClassACO.prototype.antsMove = function(number){
  var Ants=[];
  var _this=this;
  for (var a=0;a<number;a++) {
    var ant ={
    trail:[_this.startAt],
    energy:0,
    distance : 0,
    preAt:'',
    nowAt:_this.startAt
    }
    var v=_this.antMove(ant );
    Ants.push(v);
  }
  return Ants;
}
ClassACO.prototype.disPh= function(){
  var dis_para=0.3;
  var _this=this;
  _this.pheromones.forEach(function(phForm , i){
    phForm.forEach(function(phTo,j){
      phTo.pheromone_val*=dis_para
    })
  })
}
ClassACO.prototype.leavePHForAnts = function (Ants){
  var _this = this;
  var bestNumber = Math.floor(Ants.length*0.6)
  var ants = Ants.slice(0,bestNumber)
  Ants.forEach(function(ant,ind){
    if (ant.nowAt==_this.end){
      _this.leavePh(ant);
    }
  });
}
ClassACO.prototype.leavePh=function(ant){
  var p=ant.trail.slice(0);
  var p_ini=p.shift();
  var p_to;
  while (p_to=p.shift()){
    if(this.mode>0)
      this.addPh(p_ini,p_to,59.76*this.directDistance/(ant.energy*ant.trail.length));
    else 
      this.addPh(p_ini,p_to,this.directDistance/(ant.distance*ant.trail.length));
    p_ini=p_to;
  } 
} 
ClassACO.prototype.addPh=function(src,dest,val){
  src=this.getIndOfPoint(src);
  this.pheromones[src].forEach(function(v,i){
    if(v.dest==dest){
      v.pheromone_val=v.pheromone_val+val;
    }
  });
}
ClassACO.prototype.getIndOfPoint=function(v){
  var op="";
  this.points.forEach(function( point , key ) {
    if(v==point.text)op=key;
  });
  return op;  
}
ClassACO.prototype.getDistance = function( lat1,  lng1,  lat2,  lng2){
  var rad = function(d){
    return d * Math.PI / 180.0;
  }
  var radLat1 = rad(lat1);
  var radLat2 = rad(lat2);
  var a = radLat1 - radLat2;
  var b = rad(lng1) - rad(lng2);
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) + Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
  s = s * 6378.137;  //EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000;
  return s;
}
ClassACO.prototype.calDistance=function(src,dest){
  src = this.getIndOfPoint(src);
  dest= this.getIndOfPoint(dest);
  var length = this.getDistance(this.points[src].x,this.points[src].y,this.points[dest].x,this.points[dest].y);
  return length;
}
ClassACO.prototype.calEnergy=function(src,dest,pre){
  var degEnergy = function(deg){
    if(deg<(-6))return 0.3;
    else if(deg<0)return 1-0.0194*Math.pow(-deg,2);
    else if(deg<10)return 1+0.15*Math.pow(deg,1.7);
    else return 9;
  }
  src = this.getIndOfPoint(src);
  dest= this.getIndOfPoint(dest);
  pre = this.getIndOfPoint(pre)
  var dh=this.points[dest].h-this.points[src].h;
  var length = this.getDistance(this.points[src].x,this.points[src].y,this.points[dest].x,this.points[dest].y);
  var deg=Math.atan(dh/length)*360/3.14;
  var v2x = this.points[dest].x-this.points[src].x
  var v2y = this.points[dest].y-this.points[src].y
  var v1x = this.points[src].x-this.points[pre].x
  var v1y = this.points[src].y-this.points[pre].y
  var ACorssB = v1x *v2y - v1y* v2x
  var left = ACorssB < 0 
  var lengthAC = this.getDistance(this.points[dest].x,this.points[dest].y,this.points[pre].x,this.points[pre].y)
  var lengthAB = this.getDistance(this.points[src].x,this.points[src].y,this.points[pre].x,this.points[pre].y)
  var lengthBC = length
  var theta = lengthAB*lengthAB +lengthBC*lengthBC - lengthAC*lengthAC
  theta = theta/ (2*lengthAB*lengthBC)
  theta = Math.acos(theta) *180/Math.PI
  theta = 180 - theta
  var ret = 0;
  if(pre==src)ret+=0//  //  start
  else if(theta<20)ret+=0;//0.15   // straigt
  else ret+=(left?0.6:0.35)
  ret = ret + 59.76*length*degEnergy(deg);  //where 59.76 is the energy per meter
  return ret
}
