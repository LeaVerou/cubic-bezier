/*
 * Copyright (c) 2013 Lea Verou. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

(function() {

var self = window.bezierLibrary = {
	curves: {},
	
	render: function() {
		var items = $$('a', library);
		
		for(var i=items.length; i--;) {
			library.removeChild(items[i]);
		}
		
		for (var name in self.curves) {
			try { var bezier = new CubicBezier(self.curves[name]); }
			catch(e) { continue; }
			
			self.add(name, bezier);
		}
	},
	
	add: function (name, bezier) {
		var canvas = document.createElement('canvas').prop({
				width:100,
				height:100
			}),
			a = document.createElement('a').prop({
				href: '#' + bezier.coordinates,
				bezier: bezier,
				bezierCanvas: new BezierCanvas(canvas, bezier, .15)
			});
		
		if(!bezier.applyStyle) console.log(bezier);
		bezier.applyStyle(a);
		
		library.insertBefore(a, $('footer', library));
		
		a.appendChild(canvas)
		
		a.appendChild(document.createElement('span').prop({
			textContent: name,
			title: name
		}));
		
		a.appendChild(document.createElement('button').prop({
			innerHTML: '×',
			title: 'Remove from library',
			onclick: function(evt) {
				evt.stopPropagation();
				
				if (confirm('Are you sure you want to delete this? There is no going back!')) {
					self.deleteItem(this.parentNode);
				}
				
				return false;
			}
		}));
		
		a.bezierCanvas.plot(self.thumbnailStyle);
		
		a.onclick = this.selectThumbnail;
		
		if (!/^a$/i.test(a.previousElementSibling.nodeName)) {
			a.onclick();
		}
	},
	
	selectThumbnail: function() {
		var selected = $('.selected', this.parentNode);
		
		if (selected) {
			selected.classList.remove('selected');
			selected.bezierCanvas.plot(self.thumbnailStyle);
		}
		
		this.classList.add('selected');
		
		this.bezierCanvas.plot(self.thumbnailStyleSelected);
		
		compare.style.cssText = this.style.cssText;

		compare.style.setProperty(prefix + 'transition-duration', getDuration() + 's', null);

		compareCanvas.bezier = this.bezier;
		
		compareCanvas.plot({
			handleColor: 'rgba(255,255,255,.5)',
			bezierColor: 'white',
			handleThickness: .03,
			bezierThickness: .06
		});
	},
	
	deleteItem: function(a) {
		var name = $('span', a).textContent;
							
		delete bezierLibrary.curves[name];

		bezierLibrary.save();
		
		library.removeChild(a);
		
		if (a.classList.contains('selected')) {	
			$('a:first-of-type', library).onclick();
		}
	},
	
	save: function(curves) {
		localStorage.curves = JSON.stringify(curves || self.curves);
	},
	
	thumbnailStyle: {
		handleColor: 'rgba(0,0,0,.3)',
		handleThickness: .018,
		bezierThickness: .032
	},
	
	thumbnailStyleSelected: {
		handleColor: 'rgba(255,255,255,.6)',
		bezierColor: 'white',
		handleThickness: .018,
		bezierThickness: .032
	}
};

})();

/**
 * Init
 */

// Ensure global vars for ids (most browsers already do this anyway, so…)
[
	'values', 'curve','P1','P2', 'current', 'compare', 'duration', 
	'library', 'save', 'go', 'import', 'export', 'json', 'importexport'
].forEach(function(id) { window[id] = $('#' + id); });

var ctx = curve.getContext("2d"),
	bezierCode = $('h1 code'),
	curveBoundingBox = curve.getBoundingClientRect(),
	bezierCanvas = new BezierCanvas(curve, null, [.25, 0]),
	currentCanvas = new BezierCanvas(current, null, .15),
	compareCanvas = new BezierCanvas(compare, null, .15),
	favicon = document.createElement('canvas'),
	faviconCtx = favicon.getContext('2d');

// Add predefined curves
if (!localStorage.curves) {
	bezierLibrary.save(CubicBezier.predefined);
}

bezierLibrary.curves = JSON.parse(localStorage.curves);

bezierLibrary.render();

if(location.hash) {
	bezierCanvas.bezier = window.bezier = new CubicBezier(location.hash);
	
	var offsets = bezierCanvas.offsets;
	
	P1.style.prop(offsets[0]);
	P2.style.prop(offsets[1]);
}

favicon.width = favicon.height = 16;

update();
updateDelayed();

/**
 * Event handlers
 */
// Make the handles draggable
P1.onmousedown = 
P2.onmousedown = function() { 
	var me = this;
	
	document.onmousemove = function drag(e) {
		var x = e.pageX, y = e.pageY,
			left = curveBoundingBox.left,
			top = curveBoundingBox.top;
		
		if (x === 0 && y == 0) {
			return;
		}
		
		// Constrain x
		x = Math.min(Math.max(left, x), left + curveBoundingBox.width);
		
		me.style.prop({
			left: x - left + 'px',
			top: y - top + 'px'
		});
		
		update();
	};
	
	document.onmouseup = function () {
		me.focus();
		
		document.onmousemove = document.onmouseup = null;
	}
};

P1.onkeydown =
P2.onkeydown = function(evt) {
	var code = evt.keyCode;
	
	if(code >= 37 && code <= 40) {
		evt.preventDefault();
		
		// Arrow keys pressed
		var left = parseInt(this.style.left),
			top = parseInt(this.style.top)
			offset = 3 * (evt.shiftKey? 10 : 1);

		switch (code) {
			case 37: this.style.left = left - offset + 'px'; break;
			case 38: this.style.top = top - offset + 'px'; break;
			case 39: this.style.left = left + offset + 'px'; break;
			case 40: this.style.top = top + offset + 'px'; break; 
		}
		
		update();
		updateDelayed();
		
		return false;
	}
};

P1.onblur =
P2.onblur =
P1.onmouseup =
P2.onmouseup = updateDelayed;

curve.onclick = function(evt) {
	var left = curveBoundingBox.left,
		top = curveBoundingBox.top,
		x = evt.pageX - left, y = evt.pageY - top;
		
	// Find which point is closer
	var distP1 = distance(x, y, parseInt(P1.style.left), parseInt(P1.style.top)),
		distP2 = distance(x, y, parseInt(P2.style.left), parseInt(P2.style.top));

	(distP1 < distP2? P1 : P2).style.prop({
		left: x + 'px',
		top: y + 'px'
	});
	
	update();
	updateDelayed();
	
	function distance(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	}
};

curve.onmousemove = function(evt) {
	var left = curveBoundingBox.left,
		top = curveBoundingBox.top,
		height = curveBoundingBox.height,
		x = evt.pageX - left, y = evt.pageY - top;
	
	this.parentNode.setAttribute('data-time', Math.round(100 * x / curveBoundingBox.width));
	this.parentNode.setAttribute('data-progression', Math.round(100 * (3*height/4 - y) / (height * .5)));
};

save.onclick = function() {
	var rawValues = bezier.coordinates + '',
		name = prompt('If you want, you can give it a short name', rawValues);
	
	if(name) {
		bezierLibrary.add(name, bezier);
		
		bezierLibrary.curves[name] = rawValues;
		
		bezierLibrary.save();
	}
};

go.onclick = function() {
	updateDelayed();
	
	current.classList.toggle('move');
	compare.classList.toggle('move');
};

duration.oninput = function() {
	var val = getDuration();
	this.nextElementSibling.textContent = val + ' second' + (val == 1? '' : 's');
	current.style.setProperty(prefix + 'transition-duration', val + 's', null);
	compare.style.setProperty(prefix + 'transition-duration', val + 's', null);
};

window['import'].onclick = function() {
	json.value = '';
	
	importexport.className = 'import';
	
	json.focus();
};

window['export'].onclick = function() {
	json.value = localStorage.curves;
	
	
	importexport.className = 'export';
	
	json.focus();
};

// Close button
importexport.elements[2].onclick = function() {
	this.parentNode.removeAttribute('class');
	
	return false;
};

importexport.onsubmit = function() {
	if(this.className === 'import') {
		var overwrite = !confirm('Add to current curves? Clicking “Cancel” will overwrite them with the new ones.');
		
		try {
			var newCurves = JSON.parse(json.value);
		} 
		catch(e) { 
			alert('Sorry mate, this doesn’t look like valid JSON so I can’t do much with it :('); 
			return false;
		}
		
		if(overwrite) {
			bezierLibrary.curves = newCurves;
		}
		else {
			for(var name in newCurves) {
				var i = 0, newName = name;
				
				while(bezierLibrary.curves[newName]) {
					newName += '-' + ++i;
				}
				
				bezierLibrary.curves[newName] = newCurves[name];
			}
		}
		
		bezierLibrary.render();
		bezierLibrary.save();
	}
	
	this.removeAttribute('class');
};

/**
 * Helper functions
 */

function getDuration() {
	return (isNaN(val = Math.round(duration.value * 10) / 10)) ? null : val;
}

function update() {
	// Redraw canvas
	bezierCanvas.bezier = 
	currentCanvas.bezier = 
	window.bezier = new CubicBezier(
		bezierCanvas.offsetsToCoordinates(P1)
		.concat(bezierCanvas.offsetsToCoordinates(P2))
	);
	
	bezierCanvas.plot();
	
	currentCanvas.plot({
		handleColor: 'rgba(255,255,255,.5)',
		bezierColor: 'white',
		handleThickness: .03,
		bezierThickness: .06
	});
	
	// Show cubic-bezier values
	var params = $$('.param', bezierCode), 
		prettyOffsets = bezier.coordinates.toString().split(',');
	
	for(var i=params.length; i--;) {
		params[i].textContent = prettyOffsets[i]; 
	}
	
	// Show webkit-friendly version, if needed
	var webkitWarning = $('header > p');
	
	if (!bezier.inRange) {
		var webkitBezier = bezier.clipped;
		
		webkitWarning.style.maxHeight = '3em';
		$('a', webkitWarning).tabIndex = '0';
		
		$('code', webkitWarning).textContent = webkitBezier;
		
		if (prefix === '-webkit-') {
			webkitBezier.applyStyle(current);
		}
	}
	else {
		webkitWarning.style.maxHeight = '';
		$('a', webkitWarning).tabIndex = '-1';
	}
}

// For actions that can wait
function updateDelayed() {
	bezier.applyStyle(current);
	
	var hash = '#' + bezier.coordinates;
	
	bezierCode.parentNode.href = hash;
	
	if(history.pushState) {
		history.pushState(null, null, hash);
	}
	else {
		location.hash = hash;
	}
	
	// Draw dynamic favicon
	
	faviconCtx
		.clearRect(0,0,16,16)
		.prop('fillStyle', '#0ab')
		.roundRect(0, 0, 16, 16, 2)
		.fill()
		.drawImage(current, 0, 0, 16, 16);
	
	
	$('link[rel="shortcut icon"]').setAttribute('href', favicon.toDataURL());
	
	document.title = bezier + ' ✿ cubic-bezier.com';
}