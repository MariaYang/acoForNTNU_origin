var app = angular.module("sampleApp", ["firebase",'uiGmapgoogle-maps','ngRoute', 'googlechart' ]);
app.config(['$routeProvider',function($routeProvider) {
   $routeProvider.when('/main',    //to  NTNU nodes select
      {
         templateUrl: 'view.html',      
         controller: 'ctrlBuild'
      }).when('/fastBuild',      //  NTNU FAST DEBUGING
      {
         templateUrl: 'fastBuild.html',
         controller:  'fastBuild'
      }).when('/aco',           
      {
         templateUrl: 'viewACO.html',
         controller: 'ctrlACO'
      }).when('/acoTaipei',      
      {
         templateUrl: 'viewACO.html',
         controller:  'ctrlACO'
      }).when('/acoNTNU',     
      {
         templateUrl: 'viewACO.html',
         controller:  'ctrlACO'
      }).otherwise(
      {
         templateUrl: 'fastBuild.html',
         controller: 'fastBuild' 
      }
   );
}]);
app.controller('ctrlBuild', function ($scope, $firebase,$location ) {
   var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map3/");
   var ntnu = {   //ntnu
      latitude :  25.02668123007588, 
      longitude: 121.52776837348938
   }
   var tanshui = {      // tanshui
      latitude:  25.175616581388173,
      longitude: 121.45005941390991
   }  
   var center = ntnu;
   if($location.path().match('tanshui')){
      var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map4/");
      center  = tanshui ;
   }
   var sync = $firebase(ref);
   $scope.isLock = true ;     
   $scope.markers =[];
   $scope.polys=[];
   $scope.focus=null;
   var fireMarkers= sync.$asArray();   
   
   //start error
   fireMarkers.$loaded().then(function(data) {  //  pre del trival nodes
      angular.forEach(data,function(mark,i){
         var indMark = data.$indexFor(mark.$id); // from
         if(!mark.nodeTo)return;
         for(var i=0;i<mark.nodeTo.length;i++){
            var indTo = data.$indexFor(mark.nodeTo[i]);   // to who
            if(indTo==-1)
            {  //to nobady
               console.log("splice a node");
               var idDel=mark.nodeTo.indexOf(mark.nodeTo[i]);
               if(idDel==-1) ; // actual empty
               else {
                  mark.nodeTo.splice(idDel,1);
                  i--;
               }  
            }
         };
         data.$save(indMark);
      });
      $scope.markers= fireMarkers;
      fireMarkers.$watch(function(e){
         if(e.event=='child_changed'&&ind_focus){   //  not fresh when  is focus on a point while lining
            var ind_focus = fireMarkers.$indexFor($scope.focus);
            $scope.draw(fireMarkers[ind_focus]);
         }
      });
      $scope.draw();
   }).catch(function(error) {
      //console.error("Error:", error);
   });

   //  end error
   $scope.map ={ 
      center: center, 
      zoom: 16 ,
      events : {   // space click event =>  add a new point
         click:function(marker,eventName,args){
            var latLng = args[0].latLng;
            if ($scope.markers.length)return;
            //getAttituteAndPush(latLng);
            // $scope.markers.push({
            //    $id:0,
            //    latitude:latLng.lat(),
            //    longitude:latLng.lng(),
            //    nodeTo:''
            // });
            // jo($scope.markers)
         },
         rightclick:function(marker,eventName,args){
            var latLng = args[0].latLng;
            if($scope.markers.length)$scope.markers.$add({
               latitude:latLng.lat(),
               longitude:latLng.lng(),
               nodeTo:''
            });
         }
      }
   };
   $scope.options={ 
      draggable: true,
      opacity : 1
   };
   $scope.seletedOptions={ 
      draggable: !$scope.isLock ,
      icon :{
         url :'http://icongal.com/gallery/image/446944/map_marker_bubble_azure_google_marker.png',
         scaledSize: new google.maps.Size(40, 40)
      }
   };
   $scope.markerEvent = {
      dragend: function (marker, eventName, args) {
         var lat = marker.getPosition().lat();
         var lng = marker.getPosition().lng();
         var ind = $scope.markers.$indexFor(marker.key); 
         $scope.markers[ind].latitude=lat;
         $scope.markers[ind].longitude=lng;
         $scope.markers.$save(ind);
      },
      click: function(marker,eventName,args){
         var ind_now = $scope.markers.$indexFor(marker.key);   
         if(!$scope.focus){    //choose  a
            $scope.focus=marker.key;
            $scope.draw($scope.markers[ind_now]);   // draw a node
            marker.model.icon=$scope.seletedOptions.icon;
         }
         else if($scope.focus==marker.key){  // end  a
            marker.model.icon='';
            //$scope.markers[ind_now].$save();
            $scope.focus=null;
            $scope.draw();
         }
         else {        //choose b
            var index_from = $scope.markers.$indexFor($scope.focus);
            if(!$scope.markers[index_from].nodeTo||$scope.markers[index_from].nodeTo==''){   // if empty
               $scope.markers[index_from].nodeTo=[];     
            }
            var ind_exist = $scope.markers[index_from].nodeTo.indexOf(marker.key) ;
            console.log(ind_exist);
            if( ind_exist>-1 ){     // alrady existed   remove it 
               $scope.markers[index_from].nodeTo.splice(ind_exist,1);
            }else {           // not exited push it
               $scope.markers[index_from].nodeTo.push(marker.key);
            }
            $scope.markers.$save(index_from);
            $scope.draw($scope.markers[index_from]);
         }
      }
   }
   var strokeBlue= {
      color: '#6060FB',
      weight: 3
   }
   var stroke= {
      color: '#FF1493',
      weight: 3
   }
   $scope.getMarkers=function(){
      $scope.options.opacity=($scope.options.opacity?0:1);
      $scope.markers= fireMarkers;
   }
   $scope.draw=function(tar){
      $scope.polys=[];
      if(tar){
         angular.forEach(tar.nodeTo,function(node,j){
            var path=[];
               path.push({    //from
                  latitude:tar.latitude,
                  longitude:tar.longitude
               });
               var ind = fireMarkers.$indexFor(node);   //target index
               path.push({    //to
                  latitude:fireMarkers[ind].latitude,
                  longitude:fireMarkers[ind].longitude
               })
               $scope.polys.push({
                  id:tar.$id+node,
                  path:path,
                  stroke:stroke
               });
            });
         return;
      }
      angular.forEach(fireMarkers,function(mark,i){
         angular.forEach(mark.nodeTo,function(node,j){
            var path=[];
            path.push({
               latitude:mark.latitude,
               longitude:mark.longitude
            });
            var ind = fireMarkers.$indexFor(node);
            var strokeToPush=stroke;
            angular.forEach(fireMarkers[ind].nodeTo,function(v){
               if(v==mark.$id)strokeToPush=strokeBlue;
            });   
            path.push({
               latitude:fireMarkers[ind].latitude,
               longitude:fireMarkers[ind].longitude
            })
            $scope.polys.push({
               id:mark.$id+node,
               path:path,
               stroke:strokeToPush
            });
         });
      });
   }
});

app.controller('fastBuild', function ($scope, $firebase,$location ) {
   var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map3/");
   var ntnu = {   //ntnu
      latitude :  25.02668123007588, 
      longitude: 121.52776837348938
   }
   var center = ntnu;
 
   
   if($location.path().match('tanshui'))
   {
      var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map4/");
      center  = {      // tanshui
         latitude:  25.175616581388173,
         longitude: 121.45005941390991
      }  
   }else if($location.path().match('taipei')){
      var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/mapTaipei/");
      center  = {      // taipei station
         latitude:  25.0460692600108,
         longitude: 121.51775300502777
      }
   }
   var sync = $firebase(ref);
   $scope.isLock = false ;     
   $scope.markers =[];
   $scope.polys=[];
   $scope.focus=null;
   var fireMarkers= sync.$asArray();   
   $scope.icons=[];
   $scope.markersControl={}
   //start error
   fireMarkers.$loaded().then(function(data) {  //  pre del trival nodes
      $scope.markers= data;
      angular.forEach(data,function(mark,i){
         var indMark = data.$indexFor(mark.$id); // from
         if(!mark.nodeTo)return;
         for(var i=0;i<mark.nodeTo.length;i++){
            var indTo = data.$indexFor(mark.nodeTo[i]);   // to who
            if(indTo==-1)
            {  //to nobady
               console.log("splice a node");
               var idDel=mark.nodeTo.indexOf(mark.nodeTo[i]);
               if(idDel==-1) ; // actual empty
               else {
                  mark.nodeTo.splice(idDel,1);
                  i--;
               }  
            }
         };
         data.$save(indMark);
      });
      fireMarkers.$watch(function(e){
         if(e.event=='child_changed'){
            var ind_focus = fireMarkers.$indexFor($scope.focus);
            $scope.draw(fireMarkers[ind_focus]);
         }
      });
      $scope.draw();
   }).catch(function(error) {
      //console.error("Error:", error);
   });
   //  end error
   $scope.map ={ 
      center: center, 
      zoom: 16 ,
      events : {   // space click event =>  add a new point
         rightclick:function(marker,eventName,args){
            var latLng = args[0].latLng;
            if($scope.markers.length)$scope.markers.$add({
               latitude:latLng.lat(),
               longitude:latLng.lng(),
               nodeTo:''
            });
         }
      },
      control:{}
   };
   $scope.options={ 
      draggable: false,
      opacity : 1
   };
   $scope.seletedOptions={ 
      draggable: true,
      icon :{
         url :'http://icongal.com/gallery/image/446944/map_marker_bubble_azure_google_marker.png',
         scaledSize: new google.maps.Size(40, 40)
      }
   };
   $scope.polysEvent = {

   }
   $scope.markerEvent = {
      dragend: function (marker, eventName, args) {
         var lat = marker.getPosition().lat();
         var lng = marker.getPosition().lng();
         var ind = $scope.markers.$indexFor(marker.key); 
         $scope.markers[ind].latitude=lat;
         $scope.markers[ind].longitude=lng;
         $scope.markers.$save(ind);
         marker.setDraggable(false);
         marker.setIcon();
         $scope.focus=null;
         $scope.$apply();
       },
      click: function(marker,eventName,args){
         var ind_now = $scope.markers.$indexFor(marker.key);   
         if(!$scope.focus){    //choose  a

            $scope.focus=marker.key;
               // draw a node
            marker.setDraggable(true);
            marker.setIcon($scope.seletedOptions.icon);
            //marker.setOptions($scope.seletedOptions);
            $scope.draw($scope.markers[ind_now]);
         }
         else if($scope.focus==marker.key){  // end  a

            marker.setDraggable(false);
            //marker.setOptions($scope.options);
            marker.setIcon();
            $scope.focus=null;
            $scope.draw();
         }
         else {        //choose b
   
            var index_from = $scope.markers.$indexFor($scope.focus);
            if(!$scope.markers[index_from].nodeTo||$scope.markers[index_from].nodeTo==''){   // if empty
               $scope.markers[index_from].nodeTo=[];     
            }
            var ind_exist = $scope.markers[index_from].nodeTo.indexOf(marker.key) ;
            if( ind_exist>-1 ){     // alrady existed   remove it 
               $scope.markers[index_from].nodeTo.splice(ind_exist,1);
            }else {           // not exited push it
               $scope.markers[index_from].nodeTo.push(marker.key);
            }
            $scope.markers.$save(index_from);
            //$scope.draw($scope.markers[index_from]);
         }
      }

   }
   var strokeBlue= {
      color: '#6060FB',
      weight: 3
   }
   var stroke= {
      color: '#FF1493',
      weight: 3
   }
   $scope.showMarkers=function(){
      $scope.options.opacity=($scope.options.opacity?0:1);
      var ms= $scope.markersControl.getGMarkers();
      angular.forEach(ms,function(f){
         f.setOptions($scope.options);
      })
   }
   $scope.draw=function(tar){
      $scope.polys=[];
      if(tar){
         angular.forEach(tar.nodeTo,function(node,j){
            var path=[];
               path.push({    //from
                  latitude:tar.latitude,
                  longitude:tar.longitude
               });
               var ind = fireMarkers.$indexFor(node);   //target index
  
               path.push({    //to
                  latitude:fireMarkers[ind].latitude,
                  longitude:fireMarkers[ind].longitude
               })
               $scope.polys.push({
                  id:tar.$id+node,
                  path:path,
                  stroke:stroke
               });

               //$scope.$apply($scope.polys)
            });
         return 
      }
      angular.forEach(fireMarkers,function(mark,i){
         if(!mark.nodeTo)return;
         angular.forEach(mark.nodeTo,function(node,j){
            var path=[];
            path.push({
               latitude:mark.latitude,
               longitude:mark.longitude
            });
            var ind = fireMarkers.$indexFor(node);
            var strokeToPush=stroke;
            angular.forEach(fireMarkers[ind].nodeTo,function(v){
               if(v==mark.$id)strokeToPush=strokeBlue;
            });   
            path.push({
               latitude:fireMarkers[ind].latitude,
               longitude:fireMarkers[ind].longitude
            })
            $scope.polys.push({
               id:mark.$id+node,
               path:path,
               stroke:strokeToPush
            });
         });
      });
   }
});
app.controller('ctrlACO', function ($scope, $firebase,$location ,$q) {
   var center = {      // tanshui
      $id:0,
      latitude:  25.175616581388173,
      longitude: 121.45005941390991
   }  
   var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map4/");
   if($location.path().match('acoTaipei')){
      var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/mapTaipei/");
      center  = {      // taipei station
         $id:0,
         latitude:  25.0460692600108,
         longitude: 121.51775300502777
      }
   }
   if($location.path().match('acoNTNU')){
      var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map3/");
      center  = {      // taipei station
         $id:0,
         latitude :  25.02668123007588, 
         longitude: 121.52776837348938
      }
   }
   var sync = $firebase(ref);
   $scope.polys=[];
   $scope.bestPolysDistance={
      path:[],
      stroke:{}
   }
   $scope.bestPolysEnergy={
      path:[],
      stroke:{}
   }
   var fireMarkers= sync.$asArray();   
   $scope.markerStart=center;
   $scope.markerStop =center; 
   //start error
   fireMarkers.$loaded().then(function(data) {  //  pre del trival nodes
      var helf = data.length/2;
      var start = Math.floor( (Math.random() * helf) + 0);
      var stop  = Math.floor( (Math.random() * helf) + helf );
      var lls=[]
      lls.push(new google.maps.LatLng(data[start].latitude,data[start].longitude))
      lls.push(new google.maps.LatLng(data[stop].latitude,data[stop].longitude))
      $scope.shortest = {
         distance:['please "initialize"','please "initialize"'],
         energy:['please "initialize"','please "initialize"']
      }
      getAttitute(lls,function(req){
         $scope.markerStart.altitude = req[0].elevation.toFixed(4);
         $scope.markerStop.altitude = req[1].elevation.toFixed(4);
         $scope.$apply();
      })
      $scope.markerStart=
      {
         latitude : data[start].latitude.toFixed(4),
         longitude: data[start].longitude.toFixed(4),
         $id :      data[start].$id,
         //icon :      markerStartIcon,
      }
      $scope.markerStop= 
      {
         latitude:data[stop].latitude.toFixed(4),
         longitude:data[stop].longitude.toFixed(4),
         $id:data[stop].$id,
      }
      $scope.distance = getDistance($scope.markerStart.latitude,$scope.markerStart.longitude,$scope.markerStop.latitude,$scope.markerStop.longitude)
      $scope.distance = $scope.distance.toFixed(4)
      //$scope.markers.push(data[stop]);
      angular.forEach(data,function(mark,i){
         var indMark = data.$indexFor(mark.$id); // from
         if(!mark.nodeTo)return;
         for(var i=0;i<mark.nodeTo.length;i++){
            var indTo = data.$indexFor(mark.nodeTo[i]);   // to who
            if(indTo==-1)
            {  //to nobady
               console.log("splice a node");
               var idDel=mark.nodeTo.indexOf(mark.nodeTo[i]);
               if(idDel==-1) ; // actual empty
               else {
                  mark.nodeTo.splice(idDel,1);
                  i--;
               }  
            }
         };
         data.$save(indMark);
      });
      //
      $scope.draw();
   }).catch(function(error) {
      //console.error("Error:", error);
   });
   //  end error
   $scope.map ={ 
      center: center, 
      zoom: 16 ,
      events : {   // space click event =>  add a new point
         click:function(map,eventName,args){
            var latLng = args[0].latLng;
            //if ($scope.markers.length>=2)return;
            // //getAttituteAndPush(latLng);
            // $scope.markers.push({
            //    $id : $scope.markers.length,
            //    latitude : latLng.lat(),
            //    longitude : latLng.lng(),
            // });
            // $scope.$apply();
         }
      },
      control:{},
   };
   $scope.markerStartOptions={ 
      draggable: true,
      opacity : 1
   };
   $scope.markerStopOptions={ 
      draggable: true ,
      icon :{
         url :'http://icongal.com/gallery/image/446944/map_marker_bubble_azure_google_marker.png',
         scaledSize: new google.maps.Size(40, 40)
      }
   };
   $scope.markerEvent = {
      dragend: function (marker, eventName, args) {
         var tar = $scope.markerStart;
         if($scope.markerStart.$id != marker.model.idKey)tar = $scope.markerStop;
         var f = {
            latitude : marker.getPosition().lat(),
            longitude : marker.getPosition().lng()
         }
         tar.latitude=f.latitude;
         tar.longitude=f.longitude;
         var latlng=new google.maps.LatLng(f.latitude,f.longitude)
         getAttitute([latlng],function(req){
            tar.altitude = req[0].elevation.toFixed(4);
            $scope.$apply();
         })
         $scope.$apply();
         var closest = findClosest( f ,fireMarkers);
         tar.latitude=closest.latitude.toFixed(4);
         tar.longitude=closest.longitude.toFixed(4);
         tar.$id = closest.$id;
         $scope.shortest = {
            distance:'please "initialize"',
            energy:'please "initialize"'
         }
         $scope.distance = getDistance($scope.markerStart.latitude,$scope.markerStart.longitude,$scope.markerStop.latitude,$scope.markerStop.longitude)
         $scope.distance = $scope.distance.toFixed(4)
         $scope.$apply();
         $scope.draw();
      },
   }
   $scope.aco=function(){
      var latLngs = [];
      fireMarkers.forEach(function(node){
         latLngs.push(new google.maps.LatLng( node.latitude , node.longitude));
      })
      var points=[]
      getAttitute(latLngs,function(request){
         fireMarkers.forEach(function( node,ind ){
            if(ind==16||ind==10)node.h = 0.001;
            else node.h=0;
            node.x = node.latitude;
            node.y = node.longitude;
            node.text = node.$id; 
            
            points.push(node);
         });
         $scope.chartObjectDistance.data.rows=[]
         $scope.chartObjectEnergy.data.rows=[]
         $scope.iterationCounter=0;
         $scope.polys=[]
         var  worker = new Worker('worker24.js')
         var tooLessError = function(){
            $scope.shortest.distance =  $scope.shortest.energy = 'not found ,try more numburs'
            $scope.running= 0;
            $scope.$apply()
         } 
         worker.onmessage=function(e){
            if(e.data.error=='error'){
               return tooLessError();
            }
            console.log(e.data)
            $scope.iterationCounter = e.data.counter+1
            if((e.data.counter+1)==$scope.iterations){
               $scope.running=0
            }
            $scope.chartObjectDistance.data.rows.push({
               c:
                  [
                     {
                        v: $scope.iterationCounter
                     },
                     {
                        v:e.data.distance[0],
                        f:e.data.distance[0]+'km'
                     },
                     {
                        v:e.data.distance[1],
                        f:e.data.distance[1]+'km'
                     }
                  ]
            });
            $scope.chartObjectEnergy.data.rows.push({
               c:
                  [
                     {
                        v: $scope.iterationCounter
                     },
                     {
                        v:e.data.energy[0],
                        f:e.data.energy[0]+'kJ'
                     },
                     {
                        v:e.data.energy[1],
                        f:e.data.energy[1]+'kJ'
                     }
                  ]
            });
            $scope.drawPath(e.data)
            $scope.$apply()
         }
         var ao= new ClassACO()
         ao.initPheromeFromjq(fireMarkers);
         var start={
            what:'start',
            startAt : $scope.markerStart.$id,
            mode:$scope.mode,
            end : $scope.markerStop.$id,
            points:points,
            distance:$scope.distance,
            acoTimes:$scope.iterations,
            antsNumber : $scope.antsNumber
         }
         var phs={
            what : 'phs',
            pheromones:ao.pheromones,
         }
         worker.postMessage(phs)
         worker.postMessage(start)
         
      }) 
   }
   $scope.drawPath = function( ant ){
      var pathDistance = [];
      var pathEnergy = [];
      console.log(ant)
      $scope.shortest.distance = ant.distance
      $scope.shortest.energy = ant.energy
      $scope.shortest.distance[0]=ant.distance[0].toFixed(4)
      $scope.shortest.distance[1]=ant.distance[1].toFixed(4)
      $scope.shortest.energy[0]=ant.energy[0].toFixed(4)
      $scope.shortest.energy[1]=ant.energy[1].toFixed(4)
      ant.trail[0].forEach(function(t,i){
         fireMarkers.forEach(function(fm,j){
            if (fm.$id == t){
               pathDistance.push({
                  latitude: fm.latitude,
                  longitude: fm.longitude
               });
               return;
            }
         });         
      });
      ant.trail[1].forEach(function(t,i){
         fireMarkers.forEach(function(fm,j){
            if (fm.$id == t){
               pathEnergy.push({
                  latitude: fm.latitude,
                  longitude: fm.longitude
               });
               return;
            }
         });         
      });
      $scope.bestPolysDistance={
         path:pathDistance,
         stroke:{
            color: '#6060FB',
            weight: 7
         }
      };
      $scope.bestPolysEnergy={
         path:pathEnergy,
         stroke:{
            color: '#DC143C',
            weight: 7
         }
      };
      $scope.$apply(); 
   }
   var strokeBlue= {
      color: '#ADFF2F',
      weight: 3
   }
   var stroke= {
      color: '#FF1493',
      weight: 3
   }
   $scope.draw=function(tar){
      $scope.polys=[];
      if(tar){
         angular.forEach(tar.nodeTo,function(node,j){
            var path=[];
               path.push({    //from
                  latitude:tar.latitude,
                  longitude:tar.longitude
               });
               var ind = fireMarkers.$indexFor(node);   //target index
               path.push({    //to
                  latitude:fireMarkers[ind].latitude,
                  longitude:fireMarkers[ind].longitude
               })
               $scope.polys.push({
                  id:tar.$id+node,
                  path:path,
                  stroke:stroke
               });
            });
         return;
      }
      angular.forEach(fireMarkers,function(mark,i){
         angular.forEach(mark.nodeTo,function(node,j){
            var path=[];
            path.push({
               latitude:mark.latitude,
               longitude:mark.longitude
            });
            var ind = fireMarkers.$indexFor(node);
            var strokeToPush=stroke;
            angular.forEach(fireMarkers[ind].nodeTo,function(v){
               if(v==mark.$id)strokeToPush=strokeBlue;
            });   
            path.push({
               latitude:fireMarkers[ind].latitude,
               longitude:fireMarkers[ind].longitude
            })
            $scope.polys.push({
               id:mark.$id+node,
               path:path,
               stroke:strokeToPush
            });
         });
      });
   }
   $scope.chartObjectDistance = {
     "type": "LineChart",
     "displayed": true,
     "data": {
       "cols": [
         {
           "id": "month-id",
           "label": "Month",
           "type": "string",
           "p": {}
         },
         {
           "id": "distance-id",
           "label": "By Distance",
           "type": "number",
           "p": {}
         },
         {
           "id": "energy-id",
           "label": "By Energy",
           "type": "number",
           "p": {}
         },
       ],
       "rows": []
     },
     "options": {
       "title": "Distances",
       "isStacked": "true",
       "fill": 20,
       "displayExactValues": true,
       "vAxis": {
         "title": "Distance (km)",
         "gridlines": {
           "count": 10
         }
       },
       // series:{1:{targetAxisIndex:1}},
       // vAxes:[
       //    {
       //      "title": "Distance (km)",
       //         "gridlines": {
       //            "count": 10
       //         }  
       //    }, // Nothing specified for axis 0
       //    {
       //      title:'Energy (kJ)',
       //      "gridlines": {
       //         "count": 10
       //      },
       //      textStyle:{color: 'red'}
       //   } // Axis 1
       // ],
       "hAxis": {
         "title": "Iteration",
       },
       legend: {position: 'bottom'}
     },
     "formatters": {}
   }
   $scope.chartObjectEnergy = {
     "type": "LineChart",
     "displayed": true,
     "data": {
       "cols": [
         {
           "id": "month-id",
           "label": "Month",
           "type": "string",
           "p": {}
         },
         {
           "id": "distance-id",
           "label": "By Distance",
           "type": "number",
           "p": {}
         },
         {
           "id": "energy-id",
           "label": "By Energy",
           "type": "number",
           "p": {}
         },
       ],
       "rows": []
     },
     "options": {
       "title": "Energy",
       "isStacked": "true",
       "fill": 20,
       "displayExactValues": true,
       "vAxis": {
         "title": "Energy(kJ)",
         "gridlines": {
           "count": 10
         }
       },
       "hAxis": {
         "title": "Iteration",
       },
       legend: {position: 'bottom'}
     },
     "formatters": {}
   }
});

function findClosest(point,array){
   var copy = angular.copy(array);
   copy.sort(function(a,b){
      var lata = a.latitude-point.latitude;
      var lnga = a.longitude-point.longitude;
      var latb = b.latitude-point.latitude;
      var lngb = b.longitude-point.longitude;
      return (lata*lata+lnga*lnga)-(latb*latb+lngb*lngb);
   });
   return copy[0];
}
function getDistance( lat1,  lng1,  lat2,  lng2){
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
function getAttitute(latlngs,callback){
   var elevator = new google.maps.ElevationService();
   var latlngsInLimit=[]
   var ret=[]
   var latlngsLength = latlngs.length;
   while(latlngs.length){
      latlngsInLimit.push( latlngs.splice(0,100) )
   }
   latlngsInLimit.forEach(function(latlng,ind){
      var positionalRequest = {
         'locations': latlng
      }
      elevator.getElevationForLocations(positionalRequest, 
         function(results, status) {
         if (status == google.maps.ElevationStatus.OK&&results.length) {
            results.forEach(function(r,i){
               ret[ind*100+i]=r
            })
            if(ret.length==latlngsLength)callback(ret);
         }
      }); 
   })  
}