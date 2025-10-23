// Fractal Tree Generator
let angle = 0;
let side = 700;
let size = 0.7;
let counter = 0;
let stopLen = 0;
let initialBranchSize = 0;
let lineWeight = 1;

function setup() {
  initialBranchSize = floor(random(side/6, side/2.5));
  angle = random(0.1,1.1);
  stopLen = random(side*0.01,side*0.05);
  lineWeight = random(3, 8);

  createCanvas(side, side);
  noLoop();
}

function draw() {
  background(0);
  translate(side/2, side);
  branch(initialBranchSize, stroke(floor(random(0,255)), floor(random(0,255)), floor(random(0,255))));
  values();
}

function branch(len, color) {
  counter ++;

  strokeWeight(lineWeight);

  line(0, 0, 0, -len);
  translate(0, -len);

  if (len > stopLen) {

    len = len * size

    let nextColor = stroke(floor(random(0,255)), floor(random(0,255)), floor(random(0,255)));

    push();
    rotate(angle);
    branch(len, nextColor);
    pop();
    push();
    rotate(-angle);
    branch(len, nextColor);
    pop();
  }
}

function values(){
  console.log(`counter: ${counter}`);
  console.log(`angle: ${angle}`);
  console.log(`stopLen: ${stopLen}`);
  console.log(`initialBranchSize: ${initialBranchSize}`);
  console.log(`lineWeight: ${lineWeight}`);
};
