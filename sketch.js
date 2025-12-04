

// ==============================================
// GLOBAL VARIABLES
// ==============================================

let currentScene = 1;       // Track current scene (1 or 2)
// Sprite and Animations
let character;               // The animated sprite object
let idleAni;                 // Idle animation (breathing, stationary)
let walkAni;                 // Walk forward animation (toward viewer)
let walkBackAni;             // Walk backward animation (away from viewer)

// Sound Input System
let mic;                     // Microphone input object
let micMultiplier = 3;       // Increase sensitivity
let soundThreshold = 0.09;   // Microphone level that counts as "loud" (0.0-1.0)
let currentLevel = 0;        // Current microphone level

// Introversion System
let introversion = 100;      // Introversion score (0-100, starts at max)
let introversionGainRate = 0.2;    // How fast introversion increases in quiet
let introversionLossRate = 1.0;    // How fast introversion decreases in noise

// Behavior Thresholds (based on introversion level)
let panicThreshold = 30;     // Below this, character panics and runs away
let comfortThreshold = 70;   // Above this, character feels safe to approach

// Movement and Position
let moveSpeed;               // Vertical movement speed (calculated from introversion)
let targetY;                 // Desired Y position (bottom when introverted)

// UI Controls
let showDebugInfo = true;    // Toggle for showing/hiding debug information

// Depth Simulation System
let minScale = 0.05;         // Character scale at top (far away, tiny)
let maxScale = 1.5;          // Character scale at bottom (close up, large)
let minY = 100;              // Top boundary - farthest distance
let maxY;                    // Bottom boundary - closest distance (set in setup)

// Animation Speed Controls
let walkFrameDelay;          // Walk animation frame delay (calculated from introversion)
let idleFrameDelay; 
         // Idle animation frame delay (calculated from introversion)
let SHOW_VIDEO = true;              // Show/hide video feed (toggle with touch)
let SHOW_ALL_KEYPOINTS = true; 

let TRACKED_KEYPOINT_INDEX = 1;     // Which face point to use for interaction

let CURSOR_SIZE = 30;               // Size of the tracking cursor (nose dot)
let CURSOR_COLOR = [255, 50, 50];   // Color of cursor (red)
let KEYPOINT_SIZE = 3;  
let cam;                            // PhoneCamera instance
let facemesh;                       // ML5 FaceMesh model
let faces = [];                     // Detected faces (updated automatically)
let cursor; 
// Nose control for character
let NOSE_CONTROL_ENABLED = true;    // Set to false to disable nose-driven movement
let noseX = null, noseY = null;     // Smoothed nose coordinates in canvas space
let noseSmoothing = 0.12; 
         // 0..1 lerp speed for nose -> character
 let smiley;
 // let shapeShifterAni;;
let beckImage;
let beckSize = 200;  // Reduced from 500 so it's not too big
let beckX, beckY;
let beckVisible = true;

let reckImage;
let reckSize = 200;  // Reduced from 500 so it's not too big
let reckX, reckY;
let reckVisible = true;

let leckImage;
let leckSize = 200;  // Reduced from 500 so it's not too big
let leckX, leckY;
let leckVisible = true;

let jeckImage;
let jeckSize = 200;  // Reduced from 500 so it's not too big
let jeckX, jeckY;
let jeckVisible = true;

let vid;                     // Video capture for scene 2
let w = 64;                  // Video width
let h = 48;                  // Video height
let scl = 10;   

let headImage;
let collectibles = [];
let collectedCount = 0;
let totalCollectibles = 6; 
let scene2Timer= 30;
let scene2StartTime= 0;
let player;                  // Player sprite for collection
let pixelationVisible = true; // Controls pixelation visibility
let allCollected = false;


// ==============================================
// PRELOAD - Load animations before setup
// ==============================================
function preload() {
  // Load idle animation sequence (9 frames)
  idleAni = loadAni('animations/idle/idleAnim_1.png', 15);
  
  // Load walk forward animation sequence (13 frames)
  walkAni = loadAni('animations/walk/walkAnim_1.png', 15);
  
  // Load walk backward animation sequence (13 frames)
  walkBackAni = loadAni('animations/walkBack/walkAnimBack_1.png', 15);

  beckImage = loadImage('assets/beck.png'); 
  reckImage = loadImage('assets/reck.png'); 
   leckImage = loadImage('assets/leck.png'); 
  jeckImage = loadImage('assets/jeck.png'); 
  headImage = loadImage('assets/head.png');
  
}
// ==============================================
// SETUP - Initialize everything once
// ==============================================
function setup() {
  // Enable debug panel to view errors on mobile (uncomment if needed)
  // showDebug();
  
  // Create portrait canvas matching phone proportions (9:16 aspect ratio)
  createCanvas(405, 720);
 
  beckX = width / 2;
  beckY = height / 2;


 reckX = width * 0.25;     // 25% from left (101.25)
reckY = height * 0.8;

  leckX= width * 0.75;  
  leckY = height * 0.65; 
 
   jeckX = width * 0.2;   // 20% from left
  jeckY= height * 0.9;

  
  
  
  // Set bottom boundary (character's closest position)
  maxY = height - 150;
  
  // Create microphone input object (required by p5-phone)
  mic = new p5.AudioIn();
  
  // Enable microphone with tap-to-start (required for microphone permissions)
  enableMicTap();
  
  // Initialize character sprite at bottom center (comfortable position)
  character = new Sprite(width / 2, maxY);
  character.scale = maxScale;  // Start large (close to viewer)
  
  // Configure sprite physics
  // 'kinematic' = manual position control, no gravity or physics simulation
  character.physics = 'kinematic';
  
  // Add all three animations to the sprite with names for switching
  character.addAni('idle', idleAni);
  character.addAni('walk', walkAni);
  character.addAni('walkBack', walkBackAni);
  
  // Set initial animation state
  character.changeAni('idle');
  character.ani.frameDelay = 8;  // Calm breathing initially

  // Initialize camera for FaceMesh
  cam = createPhoneCamera('user', true, 'fitHeight');
  enableCameraTap();

  cam.onReady(() => {
    let options = {
      maxFaces: 1,           // Only detect 1 face (faster)
      refineLandmarks: false,// Skip detailed landmarks (faster)
      runtime: 'mediapipe',  // Use MediaPipe runtime (same as HandPose)
      flipHorizontal: false  // Don't flip in ML5 - cam.mapKeypoint() handles mirroring
    };
    
    facemesh = ml5.faceMesh(options, () => {
      facemesh.detectStart(cam.videoElement, gotFaces);
    });
  });

  // Initialize smiley sprites
  	let smileText = `
..yyyyyy
.yybyybyy
yyyyyyyyyy
yybyybbbyy
.yybbbbyy
..yyyyyy`;

	smiley = new Sprite();
	smiley.img = spriteArt(smileText, 32);

  

 vid = createCapture(VIDEO);
  vid.size(w, h);
  vid.hide();

 player = new Sprite();
  player.diameter = 40;
  player.visible = false;
}
function gotFaces(results) {
  faces = results;
}

function checkSceneTransition() {
  if (currentScene === 1) {
    if (character.scale < 0.2 && character.y < minY + 50) {
      let distFromCenter = abs(character.x - width / 2);
      if (distFromCenter < 80) {
        currentScene = 2;
        console.log("Scene changed!");
      }
    }
  }
}

function initializeScene2() {
  // Reset scene 2 variables
  collectibles = [];
  collectedCount = 0;
  allCollected = false;
  pixelationVisible = true;
  player.visible = true;
  
  // Spawn 6 collectibles at random positions
  for (let i = 0; i < totalCollectibles; i++) {
    let collectible = {
      x: random(50, width - 50),
      y: random(50, height - 50),
      size: 60, // Small defined size
      collected: false
    };
    collectibles.push(collectible);
  }
}

function resetScene2() {
  scene2StartTime = millis();
  initializeScene2();
  console.log("Scene 2 reset!");
}
// ==============================================
// DRAW - Main game loop (runs continuously at 60fps)
// ==============================================
function draw() {
  if (currentScene === 1) {
    drawScene1();
  } else if (currentScene === 2) {
    drawScene2();
  }
}

function drawScene1() {
  background(100, 150, 200);
  // Clear background with sky blue color

  
  // Check if microphone is enabled (user has granted microphone permission)
  if (mic && mic.enabled) {
    // Step 1: Read current microphone level
    currentLevel = mic.getLevel() * micMultiplier;
    currentLevel = constrain(currentLevel, 0, 1);
    
    // Step 2: Update introversion based on sound level
    updateIntroversion();
    
    // Step 3: Calculate movement speed based on introversion
    // Lower introversion = faster retreat (more stressed)
    moveSpeed = map(introversion, 0, 100, 2.0, 0.3);
    
    // Step 4: Determine character behavior based on introversion level and sound
    if (currentLevel > soundThreshold) {
      // NOISE DETECTED - Lose confidence, potentially retreat
      if (introversion < panicThreshold) {
        // LOW INTROVERSION - Panicked! Run away to top
        targetY = minY;
        moveCharacterTowardTarget();
      } else {
        // MODERATE INTROVERSION - Uncomfortable, stop and wait
        stopCharacter();
      }
    } else {
      // QUIET ENVIRONMENT
      if (introversion > comfortThreshold) {
        // HIGH INTROVERSION - Confident enough to approach bottom
        targetY = maxY;
        moveCharacterTowardTarget();
      } else {
        // LOW/MODERATE INTROVERSION - Stay put, recovering
        stopCharacter();
      }
    }
    
    // Step 5: Update character scale to simulate depth
    updateDepthScale();
    
    // Step 6: Keep character within defined boundaries
    character.y = constrain(character.y, minY, maxY);
  } else {
    // Microphone not enabled yet - keep character idle at bottom
    stopCharacter();
  }

    if (faces.length > 0) {
      drawFaceTracking();
      // Use nose position to control character (optional)
      if (noseX !== null) noseControlCharacter();
    }

  // Draw nose ellipse (tracking cursor)
  if (noseX !== null) {
    push();
    noStroke();
    fill(CURSOR_COLOR[0], CURSOR_COLOR[1], CURSOR_COLOR[2], 220);
    ellipse(noseX, noseY, CURSOR_SIZE, CURSOR_SIZE);
    pop();
  }

  // Draw beck.png in the center of the screen
    if (beckVisible && beckImage) {
    let d = dist(character.x, character.y, beckX, beckY);

    if (d < beckSize / 2) {
      beckVisible = false;
      console.log("Collision with beck!");
    } else {
      imageMode(CENTER);
      image(beckImage, beckX, beckY, beckSize, beckSize);
      imageMode(CORNER);
    }
  }
    if (reckVisible && reckImage) {
    let d = dist(character.x, character.y, reckX, reckY);

    if (d < reckSize / 2) {
      reckVisible = false;
      console.log("Collision with reck!");
    } else {
      imageMode(CENTER);
      image(reckImage, reckX, reckY, reckSize, reckSize);
      imageMode(CORNER);
    }

    }

     if (leckVisible && leckImage) {
    let d = dist(character.x, character.y, leckX, leckY);

    if (d < leckSize / 2) {
      leckVisible = false;
      console.log("Collision with reck!");
    } else {
      imageMode(CENTER);
      image(leckImage, leckX, leckY, leckSize, leckSize);
      imageMode(CORNER);
    }

  }

     if (jeckVisible && jeckImage) {
    let d = dist(character.x, character.y, jeckX, jeckY);

    if (d < jeckSize / 2) {
      jeckVisible = false;
      console.log("Collision with reck!");
    } else {
      imageMode(CENTER);
      image(jeckImage, jeckX, jeckY, jeckSize, jeckSize);
      imageMode(CORNER);
    }

    }

  drawPerspective();
  checkSceneTransition();



 
  // Step 8: Draw UI information
 drawUI();
}
  function drawScene2() {
  background(220);


 player.x = mouseX;
  player.y = mouseY;
  
  // Calculate remaining time
  let elapsedTime = (millis() - scene2StartTime) / 1000;
  let timeRemaining = scene2Timer - elapsedTime;
  
  // Check if time ran out
  if (timeRemaining <= 0 && !allCollected) {
    resetScene2();
    return;
  }

  if (pixelationVisible) {
    vid.loadPixels();
    for (let i = 0; i < vid.width; i++) {
      for (let j = 0; j < vid.height; j++) {
        let index = ((j * vid.width) + i) * 4;
        let r = vid.pixels[index + 0];
        let g = vid.pixels[index + 1];
        let b = vid.pixels[index + 2];
        
        let c = (r + g + b) / 3;
        let s = map(c, 0, 100, 0, 20);
        fill(c);
        
        ellipse(scl/2 + i*scl, scl/2 + j*scl, s, s);
      }
    }
  }
for (let collectible of collectibles) {
    if (!collectible.collected) {
      imageMode(CENTER);
      image(headImage, collectible.x, collectible.y, collectible.size, collectible.size);
      
      // Check collision with player
      let d = dist(player.x, player.y, collectible.x, collectible.y);
      if (d < collectible.size / 2 + player.diameter / 2) {
        collectible.collected = true;
        collectedCount++;
        console.log("Collected! Total: " + collectedCount);
        
        // Check if all collected
        if (collectedCount >= totalCollectibles) {
          allCollected = true;
          pixelationVisible = false; // Hide pixelation
          console.log("All collected! Pixelation removed!");
        }
      }
    }
  }

push();
  fill(0);
  textSize(24);
  textAlign(CENTER);
  text("Time: " + Math.ceil(timeRemaining) + "s", width/2, 40);
  text("Collected: " + collectedCount + "/" + totalCollectibles, width/2, 70);
  
  if (allCollected) {
    fill(0, 255, 0);
    text("ALL COLLECTED!", width/2, height/2);
  }
  pop();
}
  function drawFaceTracking() {
  let face = faces[0];  // Ge
 if (!face.keypoints || face.keypoints.length === 0) return;
  
 let trackedKeypoint = face.keypoints[TRACKED_KEYPOINT_INDEX];
  if (!trackedKeypoint) return;
  // Map ML5/camera keypoint into canvas coordinates using p5-phone helper
 cursor = cam.mapKeypoint(trackedKeypoint);

 // Update smoothed nose coordinates used for drawing and control
 if (cursor && cursor.x !== undefined && cursor.y !== undefined) {
   // Lerp for smooth movement
   if (noseX === null) {
     noseX = cursor.x;
     noseY = cursor.y;
   } else {
     noseX = lerp(noseX, cursor.x, noseSmoothing);
     noseY = lerp(noseY, cursor.y, noseSmoothing);
   }
 }
}



/**
 * Gently move the character based on the nose position.
 * This nudges the character horizontally toward the user's nose
 * and applies a small vertical offset without fully overriding
 * the existing introversion movement system.
 */
function noseControlCharacter() {
  if (!NOSE_CONTROL_ENABLED || noseX === null) return;

  // Horizontal control: map nose X to canvas X (camera mapping already applied)
  let targetX = constrain(noseX, 0, width);
  // Smoothly move character horizontally toward targetX
  character.x = lerp(character.x, targetX, 0.12);

  // Vertical soft influence: small offset toward nose Y but keep primary introversion logic
  // We'll nudge character.y a little based on nose vertical position to add feel.
  let verticalNudge = map(noseY, 0, height, -20, 20); // -20..20 px
  character.y = constrain(lerp(character.y, character.y + verticalNudge, 0.06), minY, maxY);
}

// ==============================================
// INTROVERSION SYSTEM
// ==============================================

/**
 * Update Introversion Score
 * 
 * Tracks the character's comfort level based on environmental noise.
 * Quiet increases introversion (more comfortable, willing to be close).
 * Loud sounds decrease introversion (stressed, wants to retreat).
 */
function updateIntroversion() {
  if (currentLevel > soundThreshold) {
    // LOUD - Decrease introversion (getting stressed)
    introversion -= introversionLossRate;
  } else {
    // QUIET - Increase introversion (getting comfortable)
    introversion += introversionGainRate;
  }
  
  // Keep introversion within valid range
  introversion = constrain(introversion, 0, 100);
}

// ==============================================
// MOVEMENT FUNCTIONS
// ==============================================

/**
 * Move Character Toward Target Position
 * 
 * Smoothly moves character toward targetY (either top or bottom).
 * Uses different animations based on direction of movement.
 * Speed is determined by introversion level (stressed = faster).
 */
function moveCharacterTowardTarget() {
  let distanceToTarget = targetY - character.y;
  
  if (abs(distanceToTarget) > 5) {  // Only move if not close enough
    
    if (distanceToTarget > 0) {
      // MOVING DOWN (toward viewer/bottom)
      moveCharacterDown();
    } else {
      // MOVING UP (away from viewer/top)
      moveCharacterUp();
    }
    
  } else {
    // AT TARGET - Stop and idle
    stopCharacter();
  }
  
  // Update animation speed based on stress level
  updateAnimationSpeeds();
}

/**
 * Move Character Toward Bottom (Getting Closer)
 * 
 * Character walks DOWN the screen toward the viewer (comfortable position).
 * Used when environment is quiet and introversion is high.
 */
function moveCharacterDown() {
  // Boundary check: Stop movement if character reached bottom
  if (character.y >= maxY) {
    stopCharacter();
    return;
  }
  
  // Move character down screen (increasing Y position)
  character.y += moveSpeed;
  
  // Optimization: Only switch animation if not already walking
  if (character.ani.name !== 'walk') {
    character.changeAni('walk');
  }
  
  // Set direction: Face forward (toward viewer)
  character.mirror.x = false;
}

/**
 * Move Character Toward Top (Retreating)
 * 
 * Character walks UP the screen away from viewer (retreat position).
 * Used when environment is loud and character is stressed.
 */
function moveCharacterUp() {
  // Move character up screen (decreasing Y position)
  character.y -= moveSpeed;
  
  // Optimization: Only switch animation if not already walking backward
  if (character.ani.name !== 'walkBack') {
    character.changeAni('walkBack');
  }
  
  // No mirroring needed - walkBack animation shows proper back-facing view
  character.mirror.x = false;
}

/**
 * Stop Character (Idle State)
 * 
 * Switches character to idle/standing animation.
 * Used when character reaches target position.
 */
function stopCharacter() {
  // Clear any velocity (safety measure for kinematic physics)
  character.vel.x = 0;
  character.vel.y = 0;
  
  // Optimization: Only switch animation if not already idle
  if (character.ani.name !== 'idle') {
    character.changeAni('idle');
  }
  
  // Reset direction: Face forward
  character.mirror.x = false;
}

/**
 * Update Animation Speeds
 * 
 * Adjusts animation playback speed based on introversion level.
 * Lower introversion (more stressed) = faster animations (agitated breathing).
 * Higher introversion (comfortable) = slower animations (calm breathing).
 */
function updateAnimationSpeeds() {
  // Walk animation: stressed character moves frantically
  walkFrameDelay = int(map(introversion, 0, 100, 2, 8));
  
  // Idle animation: stressed character breathes faster
  idleFrameDelay = int(map(introversion, 0, 100, 2, 12));
  
  // Apply current frame delay to active animation
  character.ani.frameDelay = (character.ani.name === 'idle') ? idleFrameDelay : walkFrameDelay;
}

// ==============================================
// DEPTH SCALE SYSTEM
// ==============================================

/**
 * Update Depth Scale
 * 
 * Creates the illusion of 3D depth by changing the character's
 * size based on vertical position. Objects farther away (top) appear smaller,
 * while objects closer (bottom) appear larger.
 * 
 * The scale ranges from 0.05 (tiny/far) to 1.5 (large/close).
 */
function updateDepthScale() {
  // Calculate scale based on Y position using linear mapping
  // minY (top) → minScale (0.05 = tiny, far away)
  // maxY (bottom) → maxScale (1.5 = large, close up)
  let newScale = map(character.y, minY, maxY, minScale, maxScale);
  
  // Apply calculated scale to character sprite
  character.scale = newScale;
}

// ==============================================
// VISUAL ELEMENTS - Draw perspective corridor
// ==============================================

/**
 * Draw Perspective Corridor
 * 
 * Creates a simple 3D corridor effect using 4 lines that form walls
 * and a back boundary. This helps reinforce the depth illusion.
 * 
 * Visual Structure:
 * - 2 angled lines from bottom corners converge toward top center
 * - 1 horizontal line at back connects the converging lines
 * - 2 vertical lines extend from back to top of canvas (walls)
 */
function drawPerspective() {
  // Start drawing context with semi-transparent white lines
  push();
  stroke(255, 150);  // White with 150 alpha (semi-transparent)
  strokeWeight(2);
  
  // LEFT GROUND/WALL LINE
  // Starts at bottom-left corner, angles toward upper-center (40% width)
  // Creates converging perspective effect
  line(0, height, width * 0.4, minY);
  
  // RIGHT GROUND/WALL LINE
  // Starts at bottom-right corner, angles toward upper-center (60% width)
  // Mirrors left line to complete perspective convergence
  line(width, height, width * 0.6, minY);
  
  // BACK WALL HORIZONTAL LINE
  // Connects the two angled lines at minY (back boundary)
  // Forms the "back wall" of the corridor
  line(width * 0.4, minY, width * 0.6, minY);
  
  // LEFT VERTICAL WALL
  // Extends from back wall connection point to top of canvas
  // Forms left side of corridor
  line(width * 0.4, minY, width * 0.4, 0);
  
  // RIGHT VERTICAL WALL
  // Extends from back wall connection point to top of canvas
  // Forms right side of corridor
  line(width * 0.6, minY, width * 0.6, 0);
  
  pop();  // Restore drawing context
}

/**
 * Draw UI Information
 * 
 * Displays current sound level and introversion score for debugging
 * and visual feedback. Can be toggled with touch/click.
 */
function drawUI() {
  // Only show debug info if enabled
  if (!showDebugInfo) return;
  
  push();
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  
  // Display sound level with visual indicator
  text(`Sound Level: ${nf(currentLevel, 1, 3)}`, 10, 10);
  text(`Threshold: ${soundThreshold}`, 10, 30);
  
  // Display introversion score
  text(`Introversion: ${nf(introversion, 1, 1)}`, 10, 60);
  
  // Visual bar for introversion level
  let barWidth = map(introversion, 0, 100, 0, 200);
  noStroke();
  fill(100, 200, 100);
  rect(10, 85, barWidth, 15);
  
  // Visual bar for sound level
  let soundBarWidth = map(currentLevel, 0, 0.5, 0, 200);
  fill(200, 100, 100);
  rect(10, 110, soundBarWidth, 15);
  
  // Show toggle instruction
  fill(255, 200);
  textSize(12);
  text('Tap to hide/show info', 10, 135);
  
  pop();
}



// ==============================================
// TOUCH EVENT HANDLERS - Prevent default browser behavior
// ==============================================

/**
 * Touch Started Handler
 * 
 * Toggles debug information visibility on touch/click.
 * Also prevents default mobile browser behavior.
 */
// (touchStarted removed here — using the camera toggle below)

/**
 * Touch Ended Handler
 * 
 * Prevents default mobile browser behavior when touch is released.
 * Ensures consistent interaction experience across devices.
 */
function touchStarted() {
  SHOW_VIDEO = !SHOW_VIDEO;
  return false;  // Prevent default to avoid interfering with camera/ML5
}
function touchEnded() {
  return false;  // Returning false prevents default behavior
}

/**
 * Mouse Pressed Handler
 * 
 * Toggles debug information visibility on mouse click (for desktop testing).
 */
function mousePressed() {
  // Toggle debug info visibility
  showDebugInfo = !showDebugInfo;

}