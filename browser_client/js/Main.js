var canvas
var stage
var wrapper
var drawing
var zoom
var points
var mode = 1; //1=drawing, 2=erasing, 3=text, 4=navigating
var display
var typemode
var textpos

function init(){
	typemode = 0;
	canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.style.cursor = 'crosshair';
	stage = new createjs.Stage("canvas");

	createjs.Ticker.addEventListener("tick", stage);
	display = new createjs.DisplayObject();  // for zooming and navigating
	
	points = new Array();
	textpos = new createjs.Point();

	// Set up the container. We use it to draw in, and also to get mouse events.
	wrapper = new createjs.Container();
	wrapper.hitArea = new createjs.Shape(new createjs.Graphics().f("#000").dr(0,0,canvas.width, canvas.height));
	wrapper.cache(0,0,canvas.width, canvas.height); // Cache it.
	stage.addChild(wrapper);

	// Create the shape to draw into
	drawing = new createjs.Shape();
	wrapper.addChild(drawing);

	var lastPoint = new createjs.Point();

	canvas.addEventListener('mousewheel', mousewheel, false);
	canvas.addEventListener('DOMMouseScroll', mousewheel, false);

	stage.addEventListener("stagemousedown", function(e) {
		if(mode == 4){
			var offset={x:stage.x-e.stageX,y:stage.y-e.stageY};
			stage.addEventListener("stagemousemove",function(e) {
				stage.x = e.stageX+offset.x;
				stage.y = e.stageY+offset.y;
				stage.update();
			});
			stage.addEventListener("stagemouseup", function(){
				stage.removeAllEventListeners("stagemousemove");
		});
		}
		else if(mode == 1){	//drawing mode		
		
			var firstPoint = new Boolean(1);			
			
			// Listen for mousemove
			stage.addEventListener("stagemousemove", function(e){
				if(firstPoint){
					firstPoint = 0;
					lastPoint.x = e.stageX;
					lastPoint.y = e.stageY;
				}
				var point = new Object();
				point.x = e.stageX;
				point.y = e.stageY;
				point.width = 3;
				point.color = '#000';
				point.time = new Date().toLocaleString();

				// Draw a round line from the last position to the current one.
				drawing.graphics.ss(point.width, "round").s(point.color);
				drawing.graphics.mt(lastPoint.x, lastPoint.y);        
				drawing.graphics.lt(point.x, point.y);

				// Draw onto the canvas, and then update the container cache.
				wrapper.updateCache("source-over");

				// Update the last position for next move.
				lastPoint.x = point.x;
				lastPoint.y = point.y;

				points.push(point);
				drawing.graphics.clear();
			});
			
			stage.addEventListener("stagemouseup", function(){
				stage.removeAllEventListeners("stagemousemove");

				// mark end of line in points-array:
				points.push(null);
			});
		}
		else if(mode == 2){
			console.log('erase');
			// 'destination-over'
		}
		else if(mode == 3){	// text-tool:	
			var textinput = document.getElementById('text-input');
			textinput.style.display = 'block';
			textinput.value = '';			
			
			textpos.x = e.stageX - 10;
			textpos.y = e.stageY - 12
			textinput.style.left = textpos.x + 'px';
			textinput.style.top = textpos.y + 'px';
			textinput.focus();
			typemode = 1;	
		}
	});

}

function mousewheel(e) {
	wrapper.removeAllChildren();
	wrapper.updateCache();

	if(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))>0){
		zoom=1.1;
	}
	else{
		zoom=1/1.1;
	}
	//we "move" the point in the direction of the current mouse position, for smooth transition
	var new_point = new createjs.Point(
		display.regX + parseInt((stage.mouseX - display.regX)/2),
		display.regY + parseInt((stage.mouseY - display.regY)/2));
	display.x = display.regX = new_point.x;
	display.y = display.regY = new_point.y;
	display.scaleX *= zoom;
	display.scaleY = display.scaleX;

	// redraw all points:
	var lastPoint = new createjs.Point();
	lastPoint.x = points[0].x;
	lastPoint.y = points[0].y;
	for(var i = 1; i < points.length; i++){
		if(points[i] == null){
			if(!(i >= points.length-1 || points[i+1]==null)){
				lastPoint.x = points[i+1].x;
				lastPoint.y = points[i+1].y;
			}
		} else{
			var point = points[i];	
		//	point.x += display.x;
		//	point.y += display.y;
		//	point.regX = point.x;
		//	point.regY = point.y;
			point.scaleX = point.scaleY = display.scaleX;
			var pointShape = new createjs.Shape(); 
			// Draw a round line from the last position to the current one.
			var shape = new createjs.Shape()
			shape.graphics.ss(point.width, "round").s(point.color);
			shape.graphics.mt(lastPoint.x, lastPoint.y);        
			shape.graphics.lt(point.x, point.y);

			shape.scaleX = shape.scaleY = display.scaleX;
			shape.x += display.x;
			shape.y += display.y;
			shape.regX = shape.x;
			shape.regY = shape.y;

			wrapper.addChild(shape);
			lastPoint.x = point.x;
			lastPoint.y = point.y;
		}
	}
	//wrapper.addChild(drawing);
	wrapper.updateCache();
	drawing.graphics.clear;
	stage.update();
}
	


function keypress(e){
	console.log(mode);
	switch(e.keyCode){
	case 120:
		mode = 1;
		break;
	case 99:
		mode = 2;
		break;
	case 118:
		mode = 3;
		break;
	case 98:
		mode = 4;
		break;

	// just debugging:
	/*
	case 115:   //clear screen
		
		wrapper.removeAllChildren();
		wrapper.updateCache();
		break;
	case 100:   // redraw
		var lastPoint = new createjs.Point();
		lastPoint.x = points[0].x;
		lastPoint.y = points[0].y;
		for(var i = 1; i < points.length; i++){
			if(points[i] == null){
				if(!(i >= points.length-1 || points[i+1]==null)){
					lastPoint.x = points[i+1].x;
					lastPoint.y = points[i+1].y;
				}
			} else{
				var point = points[i];	
				var pointShape = new createjs.Shape(); 
				// Draw a round line from the last position to the current one.
				drawing.graphics.ss(point.width, "round").s(point.color);
				drawing.graphics.mt(lastPoint.x, lastPoint.y);        
				drawing.graphics.lt(point.x, point.y);

				// Draw onto the canvas, and then update the container cache.

				lastPoint.x = point.x;
				lastPoint.y = point.y;
			}
		}
		wrapper.addChild(drawing);
		wrapper.updateCache("source-over");
		drawing.graphics.clear;
		stage.update();
		*/
	}
}

function clicked(){
	window.alert('clicked button');
}

function canvasMousedown(e){
	e.preventDefault();
}

function textTyping(e){
	// if pressed enter:
	if(e.keyCode == 13) finishTextinput();
		
}

function finishTextinput(){
	var inputelement = document.getElementById('text-input');
	inputelement.style.display = 'none';
	
	var str = inputelement.value;
	var text = new createjs.Text(str, '20px Arial', '#000');
	text.x = textpos.x;
	text.y = textpos.y + 15;
	text.textBaseline = "alphabetic";

	stage.addChild(text);
	stage.update();
}

function usepen(){
	mode = 1;
	canvas.style.cursor = 'crosshair';
	$('#pen-button').addClass('selected');
}

function useeraser(){
	mode = 2;
	canvas.style.cursor = 'crosshair';
	$('#eraser-button').addClass('selected');
}

function usetext(){
	mode = 3;
	canvas.style.cursor = 'text';
	$('#text-button').addClass('selected');
}

function usehand(){
	mode = 4;
	canvas.style.cursor = 'move';
	$('#hand-button').addClass('selected');
}
