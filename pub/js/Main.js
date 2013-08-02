var canvas;	  // html-canvas to draw on
var stage;	  // easeljs-concept to draw on
var wrapper;	  // Container, parent of all drawn paths
var width = 3000;  // dimensions of whole document
var height = 1500;


var socket = null; //connection layer to server

var points;	  // array of all points, paths consist of lines connecting points
var mode = 1; 	  // 1=drawing, 2=erasing, 3=text, 4=navigating
var display;	  // DisplayObject to store the current zoom-state and navigation-position
var zoom;	  // factor to zoom
var textpos;	  // text-mode: position to start writing text
var typemode = 0; //text-mode: currently writing text
var brushwidth = 4;
var brushcolor = '#333333';
var pathID = -1;  // every path has an ID --> erase whole path
var lastPoint;	  // used to draw paths from the last mouse-point to the current
var temp;
var i;

function init(){
    socket = socketFactory(location.host, receiveDrawUpdate, receiveDeleteDrawing, receiveUserJoin)

	canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.style.cursor = 'crosshair';
	stage = new createjs.Stage("canvas");


	createjs.Ticker.addEventListener("tick", stage);
	display = new createjs.DisplayObject();  // for zooming and navigating
	
	points = new Array();
	textpos = new createjs.Point();

	// default brush settings for drawing:
	$('.color-button#black').addClass('selected');
	$('.tool-button#pen-button').addClass('selected');


	$(".noUiSlider").noUiSlider({
	    range: [20, 100]
	   ,start: [40, 80]
	   ,step: 20
	   ,slide: function(){
	      var values = $(this).val();
	      $(".span").text(
	         values[0] +
	         " - " +
	         values[1]
	      );
	   }
	});


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
				point.width = brushwidth;
				point.color = brushcolor;
				point.time = new Date().toLocaleString();

				// Draw a round line from the last position to the current one.
				var drawing = new createjs.Shape();
				drawing.name = pathID.toString();
				drawing.graphics.ss(point.width, "round").s(point.color);
				drawing.graphics.mt(lastPoint.x, lastPoint.y);        
				drawing.graphics.lt(point.x, point.y);

				// Draw onto the canvas, and then update the container cache.
				wrapper.addChild(drawing);
				wrapper.updateCache();

				// Update the last position for next move.
				lastPoint.x = point.x;
				lastPoint.y = point.y;

				points.push(point);
			});
			
			stage.addEventListener("stagemouseup", function(){
				stage.removeAllEventListeners("stagemousemove");

                if(!!socket) {
                    drawObject = {};
                    drawObject.thickness = brushwidth;
                    drawObject.color = brushcolor;
                    drawObject.points = points;
                    socket.sendDrawing(drawObject); //TODO this method returns md5. Save that value in combination with internal id
                }
			});
		}
		else if(mode == 2){	// ERASING-MODE
			foundObj = wrapper.getObjectUnderPoint(x, y);
			console.log(foundObj);
			if(foundObj != null){
				console.log(foundObj.name);
				//remove deleted path from wrapper:
				temp = wrapper.getNumChildren();
				i = 1;
				while(i < temp){
					if(wrapper.getChildAt(i).name == foundObj.name){
					      	wrapper.removeChildAt(i);
						temp--;
					}else{
						i++;
					}						
				}
				//console.log(wrapper.getNumChildren());
				wrapper.updateCache();
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
			pathID++;

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

// zooming not implemented right now:
function mousewheel(e) {
	/*
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
	stage.update();*/
}
	


function keypress(e){
	if(!typemode){
		switch(e.keyCode){
		case 120:	// x
			usepen();
			break;
		case 99:	// c
			useeraser();
			break;
		case 118:	// v
			usetext();
			break;
		case 98:	// b
			console.log('x, y, regX, regY, scaleX, scaleY');
			console.log('display: ' + display.x + ', ' + display.y + ', ' + display.regX + ', ' + display.regY + ', ' + display.scaleX + ', ' + display.scaleY);
			console.log('stage: ' + stage.x + ', ' + stage.y + ', ' + stage.regX + ', ' + stage.regY + ', ' + stage.zoom);
			console.log('wrapper: ' +  wrapper.x + ', ' + wrapper.y + ', ' + wrapper.regX + ', ' + wrapper.regY + ', ' + wrapper.scaleX + ', ' + wrapper.scaleY);
		
			usehand();
			break;
		}

			
	}
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
	text.name = pathID.toString();

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
	$('.tool-button.selected').removeClass('selected');
	$('#pen-button').addClass('selected');
	if(typemode) removeTextinput();
}

function useeraser(){
	mode = 2;
	canvas.style.cursor = 'crosshair';
	$('.tool-button.selected').removeClass('selected');
	$('#eraser-button').addClass('selected');
	if(typemode) removeTextinput();
}

function usetext(){
	mode = 3;
	canvas.style.cursor = 'text';
	$('.tool-button.selected').removeClass('selected');
	$('#text-button').addClass('selected');
}

function usehand(){
	mode = 4;
	canvas.style.cursor = 'move';
	$('.tool-button.selected').removeClass('selected');
	$('#hand-button').addClass('selected');
	if(typemode) removeTextinput();
}

function selectcolor(hex, color){
	brushcolor = hex;
	console.log(color);
	$('.color-button.selected').removeClass('selected');
	$('#' + color).addClass('selected');	
}

function receiveDrawUpdate(drawObject) {
    //structure of drawObject:
    //drawObject:
    //  color as hex
    //  thickness as int
    //  points as list of (x, y)
    //  md5 as string
}

function receiveDeleteDrawing(md5) {
    //remove the drawing with the given md5
}

function receiveUserJoin(userID, userName) {
    //user with given id has a new name
}
