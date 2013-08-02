var canvas	  // html-canvas to draw on
var stage	  // easeljs-concept to draw on
var wrapper	  // Container, parent of all drawn paths
var width = 3000;  // dimensions of whole document
var height = 1500;


var points	  // array of all points, paths consist of lines connecting points
var mode = 1; 	  // 1=drawing, 2=erasing, 3=text, 4=navigating
var display	  // DisplayObject to store the current zoom-state and navigation-position
var zoom	  // factor to zoom
var textpos	  // text-mode: position to start writing text
var typemode = 0; //text-mode: currently writing text
var pathID = -1;  // every path has an ID --> erase whole path
var lastPoint	  // used to draw paths from the last mouse-point to the current

function init(){

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
	//wrapper.hitArea = new createjs.Shape(new createjs.Graphics().f("#000").dr(0,0,5000, 5000));
	wrapper.cache(0,0, width, height);
	wrapper.x = display.x = -width/2 + canvas.width/2;
	wrapper.y = display.y = -height/2 + canvas.height/2;
	stage.addChild(wrapper);

	var rect = new createjs.Shape();
	console.log(wrapper.width);
	rect.graphics.setStrokeStyle(4).beginStroke('#888').drawRoundRect(1,1, width-2, height-2, 10);
	wrapper.addChild(rect);
	wrapper.updateCache();


	lastPoint = new createjs.Point();




	canvas.addEventListener('mousewheel', mousewheel, false);
	canvas.addEventListener('DOMMouseScroll', mousewheel, false);

	stage.addEventListener("stagemousedown", function(e) {

		x = e.stageX - display.x;
		y = e.stageY - display.y;

		// remove text-input if user switches to another mode:
		if(mode == 1){		// DRAWING-MODE		
			pathID++;
			var firstPoint = new Boolean(1);			
			
			// Listen for mousemove
			stage.addEventListener("stagemousemove", function(e){
				// update coordinates:
				x = e.stageX - display.x;
				y = e.stageY - display.y;

				if(firstPoint){
					firstPoint = 0;
					lastPoint.x = x;
					lastPoint.y = y;
				}
				var point = new Object();
				point.pathID = pathID;
				point.x = x;
				point.y = y;
				point.width = 4;
				point.color = '#000';
				point.time = new Date().toLocaleString();

				// Draw a round line from the last position to the current one.
				var drawing = new createjs.Shape();
				drawing.name = pathID.toString();
				drawing.graphics.ss(point.width, "round").s(point.color);
				drawing.graphics.mt(lastPoint.x, lastPoint.y);        
				drawing.graphics.lt(point.x, point.y);

				// Draw onto the canvas, and then update the container cache.
				wrapper.addChild(drawing);
				wrapper.updateCache("source-over");

				// Update the last position for next move.
				lastPoint.x = point.x;
				lastPoint.y = point.y;

				points.push(point);
			});
			
			stage.addEventListener("stagemouseup", function(){
				stage.removeAllEventListeners("stagemousemove");

				// mark end of line in points-array:
				points.push(null);
			});
		}
		else if(mode == 2){	// ERASING-MODE
			foundObj = wrapper.getObjectUnderPoint(x, y);
			console.log(foundObj);
			if(foundObj != null){
				console.log(foundObj.name);
				var deleted = new Array();
				for(i in points){
					var point = points[i];
					if(point != null && point.pathID == foundObj.name){
						// lazy-delete
						console.log('delete: ' + point.x + ', ' + point.y);

						// save deletePoints to delete them on the canvas
						deleted.push(point);
					}
				}

				// remove deleted path from canvas:
				lastPoint.x = deleted[0].x;
				lastPoint.y = deleted[0].y;
				for(i in deleted){
					var point = deleted[i];

					point.color = '#FFF';

					// Draw a round line from the last position to the current one.
					point.x;
					point.y;
					var drawing = new createjs.Shape();
					drawing.name = pathID.toString();
					drawing.graphics.ss(point.width + 2, "round").s(point.color);
					drawing.graphics.mt(lastPoint.x, lastPoint.y);        
					drawing.graphics.lt(point.x, point.y);

					wrapper.addChild(drawing);

					lastPoint.x = point.x;
					lastPoint.y = point.y;
				}
				wrapper.updateCache('source-over');
			}
		}
		else if(mode == 3){	// TEXT-MODE	
			var textinput = document.getElementById('text-input');
			textinput.style.display = 'block';
			textinput.value = '';			
			
			textpos.x = e.rawX - 10;
			textpos.y = e.rawY - 12;
			textinput.style.left = textpos.x + 'px';
			textinput.style.top = textpos.y + 'px';
			textinput.focus();
			typemode = 1;	

		} else if(mode == 4){	// NAVIGATION-MODE
			var offset={x:wrapper.x - e.stageX,y:wrapper.y - e.stageY};
			var startDragging={x:e.stageX, y:e.stageY};
			stage.addEventListener("stagemousemove",function(e) {
				x = e.stageX;
				y = e.stageY;

				horiborder = new Boolean(0);	// reached horizontal border
				vertiborder = new Boolean(0);	// reached vertical border
				if((wrapper.x >= 0 && (x - startDragging.x) > 0) || (wrapper.x <= -(width - canvas.width) && (x - startDragging.x) < 0)){
					// reached right or left border:
					vertiborder = true;
				} else vertiborder = false;
				if((wrapper.y >= 0 && (y - startDragging.y) > 0) || (wrapper.y <= -(height - canvas.height) && (y - startDragging.y) < 0)){
					// reached top or bottom border:					
					horiborder = true;	
				} else horiborder = false;

				if(horiborder && vertiborder){
					// reached horizontal & vertical border --> don't move in any direction
				} else if(vertiborder){
					wrapper.y = e.stageY + offset.y;
					wrapper.updateCache();
				} else if(horiborder){
					wrapper.x = e.stageX + offset.x;
					wrapper.updateCache();
				} else {
					// reached no borders:
					wrapper.x = e.stageX + offset.x;
					wrapper.y = e.stageY + offset.y;
					wrapper.updateCache();
				}
			});
			stage.addEventListener("stagemouseup", function(){
				stage.removeAllEventListeners("stagemousemove");

				display.x = wrapper.x;
				display.y = wrapper.y;
			});
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
	wrapper.updateCache();
	stage.update();
}
	


function keypress(e){
	if(!typemode){
		switch(e.keyCode){
		case 120:
			usepen();
			break;
		case 99:
			useeraser();
			break;
		case 118:
			usetext();
			break;
		case 98:
			console.log('x, y, regX, regY, scaleX, scaleY');
			console.log('display: ' + display.x + ', ' + display.y + ', ' + display.regX + ', ' + display.regY + ', ' + display.scaleX + ', ' + display.scaleY);
			console.log('stage: ' + stage.x + ', ' + stage.y + ', ' + stage.regX + ', ' + stage.regY + ', ' + stage.zoom);
			console.log('wrapper: ' +  wrapper.x + ', ' + wrapper.y + ', ' + wrapper.regX + ', ' + wrapper.regY + ', ' + wrapper.scaleX + ', ' + wrapper.scaleY);
		
			
			usehand();
			break;
		}

	console.log('mode: ' + mode);
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
	removeTextinput();	

	var str = $('#text-input').val();
	var text = new createjs.Text(str, '20px Arial', '#000');
	text.x = textpos.x - display.x;
	text.y = textpos.y - display.y + 15;
	text.textBaseline = "alphabetic";

	wrapper.addChild(text);
	wrapper.updateCache();
}

function removeTextinput(){
	typemode = 0;
	$('#text-input').hide();
}

function usepen(){
	mode = 1;
	canvas.style.cursor = 'crosshair';
	$('#pen-button').addClass('selected');
	if(typemode) removeTextinput();
}

function useeraser(){
	mode = 2;
	canvas.style.cursor = 'crosshair';
	$('#eraser-button').addClass('selected');
	if(typemode) removeTextinput();
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
	if(typemode) removeTextinput();
}
