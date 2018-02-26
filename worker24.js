importScripts('ClassACOAetter.js');
var acoD = new ClassACO()
var acoE = new ClassACO()
var results = [];
var antsD = []
var antsE=[]
var previousBestD;
var previousBestE;
var resultReceiver = function(event){
    results.push(parseInt(event.data,10));
    if(results.length==2){
        postMessage(results[0]+results[1]);
    }
};

var errorReceiver = function(event){
    throw event.data;
};

var onmessage = function(event){
    var ob = event.data
    if(ob.what=='phs'){
        acoE.pheromones= JSON.parse(JSON.stringify(ob.pheromones));
        acoD.pheromones= JSON.parse(JSON.stringify(ob.pheromones));
        //aco.initPheromeFromjq(ob.fireMarkers);
    }
    if(ob.what=='start'){
        acoD.startAt =acoE.startAt = ob.startAt
        acoD.end = acoE.end =ob.end
        acoD.points = acoE.points =ob.points
        acoD.directDistance=acoE.directDistance=ob.distance
        acoD.mode = 0
        acoE.mode = 1
        run(ob);
    }

};
var run = function(ob){
    for(var i=0;i<ob.acoTimes;i++){
        antsD = acoD.antsMove(ob.antsNumber);
        antsE = acoE.antsMove(ob.antsNumber);
        antsD=antsD.filter(function(v){return v!=0});
        antsD.sort(function(a,b){
           return a.energy-b.energy;
        })
        antsE=antsE.filter(function(v){return v!=0});
        antsE.sort(function(a,b){
           return a.energy-b.energy;
        })
        if(antsD.length==0||antsE.length==0){
            postMessage({
                error:'error'
            })
            return;
        }
        if (previousBestD==null)previousBestD=antsD[0]
        else if (previousBestD.distance<antsD[0].distance)antsD[0]=previousBestD
        else previousBestD = antsD[0]
        
        if (previousBestE==null)previousBestE=antsE[0]
        else if (previousBestE.energy<antsE[0].energy)antsE[0]=previousBestE
        else previousBestE = antsE[0]
        var ret={
            counter : i,
            distance : [antsD[0].distance,antsE[0].distance],
            energy : [antsD[0].energy,antsE[0].energy],
            trail : [antsD[0].trail,antsE[0].trail]
        }

        postMessage(ret);
        acoD.disPh()
        acoE.disPh()
        acoD.leavePHForAnts(antsD)
        acoE.leavePHForAnts(antsE)
    }
}
