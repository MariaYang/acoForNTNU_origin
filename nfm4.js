var app = angular.module("sampleApp", ["firebase",'uiGmapgoogle-maps',]);

app.controller('mainCtrl', function ($scope, $log, $firebase ) {
	 var ref = new Firebase("https://incandescent-fire-3550.firebaseio.com/map4/");
	var tanshui = {      // tanshui
			latitude:  25.175616581388173,
			longitude: 121.45005941390991
	}
	var sync = $firebase(ref);
	$scope.isLock = true ;     
	$scope.markers =[];
	$scope.polys=[];
	$scope.focus=null;
	var fireMarkers= sync.$asArray();
	fireMarkers.$loaded().then(function(data) {  //  pre del trival nodes
		angular.forEach(data,function(mark,i){
			var indMark = data.$indexFor(mark.$id); // from
			for(var i=0;i<mark.nodeTo.length;i++){
				var indTo = data.$indexFor(mark.nodeTo[i]);   // to who
				if(indTo==-1)
				{  //to nobady
					jo("splice a node");
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
			if(e.event=='child_changed'){
				var ind_focus = fireMarkers.$indexFor($scope.focus);
				$scope.draw(fireMarkers[ind_focus]);
			}
		});
		$scope.draw();
	}).catch(function(error) {
		console.error("Error:", error);
	});
	$scope.map ={ 
		center: tanshui, 
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
				jo(ind_exist);
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
function jo(ob){console.log(ob);}
function aa(){document.getElementById("unlockButton").click();}
function getAttituteAndPush(latlng){
	var elevator = new google.maps.ElevationService();
	var positionalRequest = {
		'locations': [latlng]
	}
	elevator.getElevationForLocations(positionalRequest, function(results, status) {
		if (status == google.maps.ElevationStatus.OK&&results[0]) {
			jo($scope.markers);
			var newMark={
				latitude  :results[0].location.lat(),
				longitude :results[0].location.lng(),
				height:results[0].elevation
			}
			jo(newMark);
		}
	});   // not use right now 
}