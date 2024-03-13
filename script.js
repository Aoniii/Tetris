"use strict";
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

const offscreenCanvas = document.createElement("canvas");
const offscreenContext = offscreenCanvas.getContext("2d");
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
offscreenContext.scale(30, 30);

const canvasNext = document.getElementById("next");
const contextNext = canvasNext.getContext("2d");

var audio = document.getElementById("audio");
var checkbox = document.getElementById("music");
audio.volume = 0.2;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const bricks = "ILJOZST";

let actualBrick;
let nextBricks = Math.floor(Math.random() * 7);

const images = {}

const colors = [
	'lightblue',
	'orange',
	'blue',
	'yellow',
	'red',
	'green',
	'purple'
];

const render = [
	{x: 45, y: 30},
	{x: 30, y: 45},
	{x: 60, y: 45},
	{x: 60, y: 60},
	{x: 45, y: 60},
	{x: 45, y: 60},
	{x: 45, y: 45},
]

const scoring = [
	0,
	40,
	100,
	300,
	1200
]

const arena = createMatrix(10, 20);
const next = createMatrix(4, 4);

const player = {
	pos: {x: 0, y: 0},
	matrix: null,
	score: 0
};

function preloadImages() {
    colors.forEach((color, index) => {
        const img = new Image();
        img.src = 'bricks/' + color + '.png';
        images[index] = img;
    });
}

function toggleMusic() {
	if (checkbox.checked)
		audio.play();
	else
		audio.pause();
}

function arenaSweep() {
	let rowCount = 0;
	outer: for(let y = arena.length - 1; y > 0; --y) {

		for (let x = 0; x < arena[y].length; ++x)
			if (arena[y][x] === 0)
				continue outer;

		arena.unshift(arena.splice(y++, 1)[0].fill(0));
		rowCount++;
	}
	player.score += scoring[rowCount];
}

function isCollide(arena, player) {
	const m = player.matrix;
	const o = player.pos;

	for (let y = 0; y < m.length; ++y)
		for (let x = 0; x < m[y].length; ++x)
			if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0)
				return (true);
	return (false);
}

function createMatrix(w, h) {
	const matrix = [];
	while (h--)
		matrix.push(new Array(w).fill(0));

	return (matrix);
}

function createBrick(type) {
	if (type === "I") {
		return [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0]
		];
	} else if (type === "L") {
		return [
			[0, 2, 0],
			[0, 2, 0],
			[0, 2, 2]
		];
	} else if (type === "J") {
		return [
			[0, 3, 0],
			[0, 3, 0],
			[3, 3, 0]
		];
	} else if (type === "O") {
		return [
			[4, 4],
			[4, 4]
		];
	} else if (type === "Z") {
		return [
			[5, 5, 0],
			[0, 5, 5],
			[0, 0, 0]
		];
	} else if (type === "S") {
		return [
			[0, 6, 6],
			[6, 6, 0],
			[0, 0, 0]
		];
	} else if (type === "T") {
		return [
			[0, 7, 0],
			[7, 7, 7],
			[0, 0, 0]
		];
	}
}

function drawMatrix(matrix, offset) {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0)
				offscreenContext.drawImage(images[value - 1], x + offset.x, y + offset.y, 1, 1);
		})
	})
}

function draw() {
	offscreenContext.fillStyle = "#f5f5f5";
	offscreenContext.fillRect(0, 0, canvas.width / 30, canvas.height / 30);
	drawMatrix(arena, {x: 0, y: 0});
	drawMatrix(player.matrix, player.pos);
	drawNextBricks();
	context.drawImage(offscreenCanvas, 0, 0);
}

function drawNextBricks() {
	contextNext.fillStyle = "#f5f5f5";
	contextNext.fillRect(0, 0, canvasNext.width, canvasNext.height);
	createBrick(bricks[nextBricks]).forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0)
				contextNext.drawImage(images[value - 1], (x - 1) * 30 + render[value - 1].x, (y - 1) * 30 + render[value - 1].y, 30, 30);
		})
	})
}

function merge(matrix, player) {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0)
				matrix[y + player.pos.y][x + player.pos.x] = value;
		})
	})
}

function rotate(matrix, dir) {
	while (dir !== 0) {
		for (let y = 0; y < matrix.length; ++y)
			for (let x = 0; x < y; ++x)
				[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];

		if (dir > 0) {
			matrix.forEach((row) => row.reverse());
			dir--;
		} else {
			matrix.reverse();
			dir++;
		}
	}
}

function playerDrop() {
	player.pos.y++;
	if (isCollide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		arenaSweep();
		updateScore();
	}

	dropCounter = 0;
}

function playerMove(offset) {
	player.pos.x += offset;
	if (isCollide(arena, player))
		player.pos.x -= offset;
}

function playerReset() {
	actualBrick = nextBricks;
	player.matrix = createBrick(bricks[actualBrick]);
	nextBricks = Math.floor(Math.random() * 7);
	player.pos.y = 0;
	player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
	if (isCollide(arena, player)) {
		arena.forEach((row) => row.fill(0));
		player.score = 0;
		updateScore();
	}
}

function playerRotate(dir) {
	const pos = player.pos.x;
	let offset = 1;

	rotate(player.matrix, dir);

	while (isCollide(arena, player)) {
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));
		if (offset > player.matrix[0].length) {
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

function update(time = 0) {
	const deltaTime = time - lastTime;
	dropCounter += deltaTime;

	if (dropCounter > dropInterval)
		playerDrop();

	lastTime = time;
	draw();
	requestAnimationFrame(update);
}

function updateScore() {
	document.getElementById("score").innerText = player.score;
}

document.addEventListener("keydown", (event) => {
	if (event.code === "KeyQ")
		playerRotate(-1);
	else if (event.code === "KeyE")
		playerRotate(1);
	else if (event.code === "KeyA")
		playerMove(-1);
	else if (event.code === "KeyS")
		playerDrop();
	else if (event.code === "KeyD")
		playerMove(1);
});

checkbox.addEventListener('change', toggleMusic);

preloadImages();
playerReset();
updateScore();
update();
