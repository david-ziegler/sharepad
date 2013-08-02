var canvas
var stage
var wrapper
var drawing
var zoom

function init(){
	canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.heigth = window.innerHeight;
	stage = new createjs.Stage("canvas");

	createjs.Ticker.addEventListener("tick", stage);


	// Set up the container. We use it to draw in, and also to get mouse events.
	wrapper = new createjs.Container();
	wrapper.hitArea = new createjs.Shape(new createjs.Graphics().f("#000").dr(0,0,800,600));
	wrapper.cache(0,0,800,600); // Cache it.
	stage.addChild(wrapper);

	// Create the shape to draw into
	drawing = new createjs.Shape();
	wrapper.addChild(drawing);

	var lastPoint = new createjs.Point();
	pos = new createjs.Point();
	pos.x = 0;
	pos.y = 0;

	canvas.addEventListener('mousewheel', mousewheel, false);
	canvas.addEventListener('DOMMouseScroll', mousewheel, false);

	stage.addEventListener("stagemousedown", function(e) {
		var offset={x:stage.x-e.stageX,y:stage.y-e.stageY};
		stage.addEventListener("stagemousemove",function(ev) {
			stage.x = ev.stageX+offset.x;
			stage.y = ev.stageY+offset.y;
			stage.update();
		});
		stage.addEventListener("stagemouseup", function(){
			stage.removeAllEventListeners("stagemousemove");
		});
	});


	wrapper.addEventListener("mousedown", function(e) {
		var point = new createjs.Shape(); 
		point.graphics.beginFill('#000').drawCircle(e.stageX,e.stageY,10);
		wrapper.addChild(point);

		
		wrapper.updateCache("source-over");

		console.log(wrapper.getNumChildren());



	
	    // Store the position. We have to do this because we clear the graphics later.
	    lastPoint.x = event.stageX;
	    lastPoint.y = event.stageY;
	    
	    /*// Listen for mousemove
	    event.addEventListener("mousemove", function(event){
		
		// Draw a round line from the last position to the current one.
		drawing.graphics.ss(20, "round").s("#ff0000");
		drawing.graphics.mt(lastPoint.x, lastPoint.y);        
		drawing.graphics.lt(event.stageX, event.stageY);
		
		// Update the last position for next move.
		lastPoint.x = event.stageX;
		lastPoint.y = event.stageY;
		
		// Draw onto the canvas, and then update the container cache.
		var erase = document.getElementById("toggle").checked;
		wrapper.updateCache(erase?"destination-out":"source-over");
		drawing.graphics.clear();
	    });*/
	});

}

function mousewheel(e) {
	if(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))>0)
		zoom=1.1;
	else
		zoom=1/1.1;
    //we "move" the point in the direction of the current mouse position, for smooth transition
    var new_point = new createjs.Point(
        stage.regX + parseInt((stage.mouseX - stage.regX)/2),
        stage.regY + parseInt((stage.mouseY - stage.regY)/2));
	stage.x = stage.regX = new_point.x;
    stage.y = stage.regY = new_point.y;
	stage.scaleX=stage.scaleY*=zoom;

	stage.update();

}
	


function keypress(e){
	/*switch(e.keyCode){
	case 61:
	case 43:   //both"+" and "=" --> zoom in
		zoomstate += zoomfactor;
		wrapper.setTransform(pos.x,pos.y, zoomstate, zoomstate,0,0,0,400,300);
		break;
	case 45:   // "-" --> zoom out
		zoomstate -= zoomfactor;
		wrapper.setTransform(pos.x, pos.y,zoomstate, zoomstate, 0,0,0, 400, 300);
		break;
	case 119:  // W --> up
		wrapper.setTransform(0,navigatepx);
		break;
	case 97:  // A --> left
		wrapper.setTransform(-navigatepx,0);
		break;
	}*/
	console.log(e.keyCode);
}
