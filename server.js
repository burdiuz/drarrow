/**
node server
http://localhost:8081
*/
(function(express){
  this.use(express.static('.'));
  this.listen(8081, function(){
	console.log('Server started...');
  });
}).apply(require('express')(), [require('express')]);
