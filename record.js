$(document).ready(function(){
  // Some simple loops to build up data arrays.
  var ws=new WebSocket('ws://127.0.0.1:7777');
  var sinPoints = [[0,0]]; 
  ws.onmessage= function(message) {

     var data=message.data.split(',')
     console.log(data);
     if(data[0]=='clearcon'){
       console.log("is clear")
       sinPoints=[]
       return
     }
     sinPoints.push( [ parseFloat(data[9]), parseFloat(data[10]) ])
     $('#volt').html(data[4])
     $('#curr').html(data[6])
     plot3.destroy();
     plot3 = $.jqplot('chartEnergy', [ sinPoints], 
         { 
            title:'Energy', 
            // Series options are specified as an array of objects, one object
            // for each series.
            series:[ 
                {
                  // Change our line width and use a diamond shaped marker.
                  lineWidth:2, 
                  markerOptions: { style:'dimaond' }
                }, 
            ]
         }
     );
  };  
  
  var plot3 = $.jqplot('chartEnergy', [ sinPoints], 
    { 
      title:'Line Style Options', 
      // Series options are specified as an array of objects, one object
      // for each series.
      series:[ 
          {
            // Change our line width and use a diamond shaped marker.
            lineWidth:2, 
            markerOptions: { style:'dimaond' }
          }, 
      ]
    }
  );
    
});