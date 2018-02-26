var http = require("http");
var url = require("url");
var path = require('path');
var fs = require('fs');
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({port: 7777});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log('received: %s', message);
  });
  ws.send('something');
});
//wss.clients[0].send('something');
http.createServer(function(request, response) {
	var pathName = url.parse(request.url).pathname;
  var mainName = pathName.split('.')[0];
  var subName = pathName.split('.')[1];
  if(pathName.indexOf('con')>0){
    no('its a control')
    no('mainName:' +pathName)
    wss.clients.forEach(function(c){
      c.send(pathName.split('/')[1]);
    })
    return

  }
  var ContentType = "text/html";
  if(!subName)pathName+='.html';
  if (subName=='css')ContentType = "text/css";
  else if (subName=='js')ContentType = "text/javascript";
  var fileName = path.join(process.cwd(),pathName);
  console.log("+++")
  console.log(path)
	fs.exists(fileName,function(exist){
    no(ContentType+':'+exist);
    if(!exist) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return ; 
    }
    fs.readFile(fileName,'binary',function(e,file){
      response.writeHead(200, {"Content-Type": ContentType});
      response.write(file,'binary');
      response.end();
    })
  })
}).listen(8888);

var request = require('request');

request.post(
    'http://maps.googleapis.com/maps/api/elevation/json?locations=24.884224, 121.541276&sensor=true_or_false',
	{ 
		form: { key: 'value' } 
	},
	function (error, response, body) {
    	if (!error && response.statusCode == 200) {
        	var r=JSON.parse(body);
        	console.log( r );
    	}
	}
);
function no(n){console.log(n);}