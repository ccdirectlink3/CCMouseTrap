let cursorLocked = false;
let cursorPos = { x: 0, y: 0 };
let cursorOffset = { x: 0, y: 0 };
let cursorSize = { x: 0, y: 0 };

let cursorImage = new Image();
cursorImage.style.position = "absolute";
cursorImage.style.pointerEvents = "none";
document.body.appendChild(cursorImage);

function setCursorLock(value) {
	cursorLocked = value;
	cursorImage.style.display = value ? 'block' : 'none';
}

function updateCursorPosition() {
	cursorPos.x = cursorPos.x.limit(
		cursorOffset.x,
		cursorOffset.x + window.innerWidth - cursorSize.x
	);
	cursorPos.y = cursorPos.y.limit(
		cursorOffset.y,
		cursorOffset.y + window.innerHeight - cursorSize.y
	);
	cursorImage.style.left = `${cursorPos.x - cursorOffset.x}px`;
	cursorImage.style.top = `${cursorPos.y - cursorOffset.y}px`;
}

setCursorLock(false);

// check for cursor image updates
ig.System.inject({
	updateCursorClass(...args) {
		let result = this.parent(...args);

		let cursorCSS = window.getComputedStyle(this.inputDom).cursor
		let match = /^url\("(.+?)"\) (\d+) (\d+)/.exec(cursorCSS);
		if(match != null && match.length === 4) {
			cursorImage.src = match[1];

			let cursorSizeGeneral = (Math.round(this.screenWidth / this.width) || 1) * 16;
			cursorSize.x = cursorSizeGeneral;
			cursorSize.y = cursorSizeGeneral;
			if(this.cursorType === "pointer") {
				// it is special
				cursorSize.x *= 45/80;
				cursorSize.y *= 60/80;
			}

			cursorOffset.x = parseInt(match[2], 10);
			cursorOffset.y = parseInt(match[3], 10);

			updateCursorPosition();
		}

		return result;
	}
});


let fakeMousemoveEvent = { pageX: 0, pageY: 0, touches: null };

ig.Input.inject({
	initMouse(...args) {
		if(!this.isUsingMouse) {
			ig.system.inputDom.addEventListener("click", this.mouseTrapClick.bind(this));
		}
		return this.parent(...args);
	},

	mouseTrapClick() {
		if(!cursorLocked) {
			ig.system.canvas.requestPointerLock();
			setCursorLock(true);
			updateCursorPosition();
		}
	},

	blur(...args) {
		document.exitPointerLock();
		setCursorLock(false);
		return this.parent(...args);
	},

	mousemove(event, ...args) {
		if(cursorLocked) {
			cursorPos.x += event.movementX;
			cursorPos.y += event.movementY;
			updateCursorPosition();

			event = fakeMousemoveEvent;
			fakeMousemoveEvent.pageX = cursorPos.x;
			fakeMousemoveEvent.pageY = cursorPos.y;
		} else {
			cursorPos.x = event.pageX;
			cursorPos.y = event.pageY;
		}

		return this.parent(event, ...args);
	}
});
