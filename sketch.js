// ==============================================
// GLOBAL VARIABLES
// ==============================================
let currentScene = 1;       // Track current scene (1, 2, 3 or 4)
let scene3BGColor;          // Random color for scene 3 background
// Whether Scene 3 should draw a colorful background (rounds 1-2)
let scene3UseColor = true;

// ROUND / TIMER SYSTEM
let currentRound = 1;                     // Which round the player is on (1..3)

// Success display when finishing a round (show Scene3 with a button to continue)
let isShowingSuccess = false;
let successDisplayStart = 0;
let successDisplayDuration = 1800; // ms to show Scene 3 before next round (no longer used for auto-advance)
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
let beck2X, beck2Y;
let beck2Visible = true;

let reckImage;
let reckSize = 200;  // Reduced from 500 so it's not too big
let reckX, reckY;
let reckVisible = true;
let reck2X, reck2Y;
let reck2Visible = true;

let leckImage;
let leckSize = 200;  // Reduced from 500 so it's not too big
let leckX, leckY;
let leckVisible = true;
let leck2X, leck2Y;
let leck2Visible = true;

let jeckImage;
let jeckSize = 200;  // Reduced from 500 so it's not too big
let jeckX, jeckY;
let jeckVisible = true;
let jeck2X, jeck2Y;
let jeck2Visible = true;


// per-scene timers removed
let totalCollectibles = 8;   // Total items to collect (each of the four appears twice)
let collectedItems = 0;

let vid;                     // Video capture for scene 2
let w = 64;                  // Video width
let h = 48;                  // Video height
let scl = 10;   

let interactiveCircle; 

// Scene 2 image pool and selection (four unique per round)
let scene2Pool = [];        // p5.Image or graphics placeholders
let scene2Selected = [];    // selected images for current round (length 4)

// Per-round Scene 2 image lists (will be filled in setup() from preload())
let scene2Rounds = [];
let drImage;
let dreImage;
let drsImage;
let drtImage;


let dlImage;
let dpeImage;
let dtoiImage;
let kioImage;

let kinoiImage;
let kinosImage;
let kinotaImage;
let kinvaImage;

// Stage images (will be set per-round by applyStageImagesForRound)
let infantImage;
let childImage;
let adultImage;
let elderImage;

function applyStageImagesForRound(roundNumber) {
  // Map per-round asset variables to the stage images
  if (!roundNumber) roundNumber = currentRound;
  if (roundNumber === 1) {
    infantImage = drImage || infantImage;
    childImage  = dreImage || childImage;
    adultImage  = drsImage || adultImage;
    elderImage  = drtImage || elderImage;
  } else if (roundNumber === 2) {
    infantImage = dlImage || infantImage;
    childImage  = dpeImage || childImage;
    adultImage  = dtoiImage || adultImage;
    elderImage  = kioImage || elderImage;
  } else if (roundNumber === 3) {
    infantImage = kinoiImage || infantImage;
    childImage  = kinosImage || childImage;
    adultImage  = kinotaImage || adultImage;
    elderImage  = kinvaImage || elderImage;
  }
}

let backgroundImage;

class InteractiveCircle {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.currentRadius = radius;
    this.targetRadius = radius;
    
    // MEMORY: Track interaction history
    this.totalTouches = 0;           // Total touches over lifetime
    this.touchesThisStage = 0;       // Touches in current life stage
    this.lastTouchTime = 0;          // When last touched
    this.birthTime = millis();       // When circle was created
    
    // EVOLUTION: Life stages
    this.stage = 'infant';           // Current life stage
    this.stageProgress = 0;          // Progress through current stage (0-100)
    this.touchesNeeded = 10;         // Touches needed to evolve
    
    // PERSONALITY: Changes with stage
    this.resistance = 0.5;           // How much it resists touch (0=no resistance, 1=full resistance)
    this.growthRate = 1.0;           // How much it grows per touch
    this.decayRate = 0.1;            // How fast it shrinks when ignored
    this.excitability = 1.0;         // How responsive to touch
    
    // ALIVENESS: Continuous animation
    this.pulsePhase = 0;
    this.pulseSpeed = 0.05;
    
    // VISUAL: Color and effects
    this.hue = 180;
    this.particles = [];
  }
  
  // Check if touch is inside circle
  contains(tx, ty) {
    let d = dist(tx, ty, this.x, this.y);
    return d < this.currentRadius;
  }
  
  // Respond to touch - behavior changes based on stage
  onTouch() {
    // If Elder stage, trigger round completion / Scene 3
    if (this.stage === 'elder') {
      // Set Scene 3 background behavior per round:
      // Round 1 -> red background
      // Round 2 -> blue background
      // Round 3 -> no colorful background (video only)
      if (currentRound === 1) {
        scene3UseColor = true;
        scene3BGColor = color(255, 0, 0);
      } else if (currentRound === 2) {
        scene3UseColor = true;
        scene3BGColor = color(0, 0, 255);
      } else {
        scene3UseColor = false;
      }

      // Proceed to Scene 3. For rounds 1-2 show the brief success display,
      // for round 3 go directly to face-tracking with no colored background.
      currentScene = 3;
      if (currentRound < 3) {
        isShowingSuccess = true;
        successDisplayStart = millis();
      } else {
        isShowingSuccess = false;
      }

      return;
    }
    
    this.totalTouches++;
    this.touchesThisStage++;
    this.lastTouchTime = millis();
    
    // RESISTANCE: Touch impact is reduced by resistance
    // Higher resistance = less response
    let touchImpact = (1 - this.resistance) * this.excitability;
    
    // Grow based on current personality
    let growth = this.baseRadius * this.growthRate * touchImpact;
    this.targetRadius += growth;
    
    // Constrain based on stage
    let maxSize = this.getMaxSize();
    this.targetRadius = constrain(this.targetRadius, this.baseRadius, maxSize);
    
    // Update stage progress
    this.stageProgress = (this.touchesThisStage / this.touchesNeeded) * 100;
    
    // Check if ready to evolve to next stage
    if (this.touchesThisStage >= this.touchesNeeded) {
      this.evolve();
    }
    
    // Create particles - fewer when resistant, more when excitable
    let particleCount = floor(5 * touchImpact);
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: random(-2, 2),
        vy: random(-2, 2),
        size: random(3, 10),
        life: 40,
        alpha: 100
      });
    }
  }
  
  // EVOLUTION: Progress to next life stage
  evolve() {
    this.touchesThisStage = 0;
    this.stageProgress = 0;
    
    // Change stage and update personality
    if (this.stage === 'infant') {
      this.stage = 'child';
      this.touchesNeeded = 15;
      this.resistance = 0.2;        // Low resistance, very responsive
      this.growthRate = 1.5;        // Grows a lot
      this.decayRate = 0.15;        // Shrinks quickly when ignored
      this.excitability = 1.5;      // Very excitable
      this.hue = 150;               // Green
      
    } else if (this.stage === 'child') {
      this.stage = 'adult';
      this.touchesNeeded = 25;
      this.resistance = 0.5;        // Moderate resistance
      this.growthRate = 0.8;        // Grows less
      this.decayRate = 0.08;        // Shrinks slowly
      this.excitability = 0.8;      // Less excitable
      this.hue = 220;               // Blue
      
    } else if (this.stage === 'adult') {
      this.stage = 'elder';
      this.touchesNeeded = 999999;  // Cannot evolve further
      this.resistance = 0.8;        // High resistance
      this.growthRate = 0.3;        // Barely grows
      this.decayRate = 0.05;        // Very stable
      this.excitability = 0.4;      // Not very excitable
      this.hue = 280;               // Purple
    }
  }
  
  // Get maximum size based on stage
  getMaxSize() {
    if (this.stage === 'infant') return this.baseRadius * 3;
    if (this.stage === 'child') return this.baseRadius * 4;
    if (this.stage === 'adult') return this.baseRadius * 5;
    if (this.stage === 'elder') return this.baseRadius * 4;
    return this.baseRadius * 3;
  }
  
  // Update state every frame
  update() {
    // PERSONALITY: Shrink over time when not touched (decay)
    let timeSinceTouch = millis() - this.lastTouchTime;
    if (timeSinceTouch > 500) {
      this.targetRadius -= this.decayRate;
      this.targetRadius = max(this.targetRadius, this.baseRadius);
    }
    
    // RESISTANCE: Smooth movement with inertia
    // Higher resistance = slower response (more inertia)
    let responseSpeed = 0.1 * (1 - this.resistance * 0.5);
    this.currentRadius = lerp(this.currentRadius, this.targetRadius, responseSpeed);
    
    // ALIVENESS: Pulse animation
    this.pulsePhase += this.pulseSpeed;
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      p.alpha = map(p.life, 0, 40, 0, 100);
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  // Draw the circle
  display() {
   colorMode(HSB, 360, 100, 100);
  
  // Calculate visual properties based on stage
  let pulseAmount = sin(this.pulsePhase) * 8;
  let displayRadius = this.currentRadius + pulseAmount;
  
  // Select image based on stage
  let currentImage;
  if (this.stage === 'infant') currentImage = infantImage;
  else if (this.stage === 'child') currentImage = childImage;
  else if (this.stage === 'adult') currentImage = adultImage;
  else if (this.stage === 'elder') currentImage = elderImage;
  
  // Draw the image instead of colored circle
  if (currentImage) {
    push();
    imageMode(CENTER);
    // Draw image with size based on radius
    image(currentImage, this.x, this.y, displayRadius * 2, displayRadius * 2);
    pop();
  }
  
  // Draw evolution progress ring (same as before)
  push();
  noFill();
  stroke(this.hue, 100, 90);
  strokeWeight(5);
  strokeCap(ROUND);
  let progressAngle = map(this.stageProgress, 0, 100, 0, TWO_PI);
  arc(this.x, this.y, displayRadius * 2.3, displayRadius * 2.3, -HALF_PI, -HALF_PI + progressAngle);
  pop();
  
  // Draw particles (same as before)
  for (let p of this.particles) {
    fill(this.hue, 80, 100, p.alpha);
    noStroke();
    circle(p.x, p.y, p.size);
  }
  
  // Draw stage indicator (same as before)
  colorMode(RGB, 0);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  text(this.totalTouches, this.x, this.y);
}
  // Get stage info for display
  getStageInfo() {
    return {
      name: this.stage.toUpperCase(),
      touches: this.totalTouches,
      progress: floor(this.stageProgress),
      resistance: floor(this.resistance * 100),
      excitability: floor(this.excitability * 100)
    };
  }
}




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

  // Scene 2 / stage assets (per-round)
  drImage = loadImage('assets/dr.png');
  dreImage = loadImage('assets/dre.png');
  drsImage = loadImage('assets/drs.png');
  drtImage = loadImage('assets/drt.png');

  dlImage = loadImage('assets/dl.png');
  dpeImage = loadImage('assets/dpe.png');
  dtoiImage = loadImage('assets/dtoi.png');
  kioImage = loadImage('assets/kio.png');

  kinoiImage = loadImage('assets/kinoi.png');
  kinosImage = loadImage('assets/kinos.png');
  kinotaImage = loadImage('assets/kinota.png');
  kinvaImage = loadImage('assets/kinva.png');

  

  backgroundImage = loadImage('assets/hey.jpg');
  // Scene 2 images (user-provided names wired here)

 
  
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
      flipped: false         // Don't flip — keep head and skeleton in sync
    };
    
    facemesh = ml5.faceMesh(options, () => {
      facemesh.detectStart(cam.videoElement, gotFaces);
    });
  });
  
    // rounds are untimed now

  // Initialize smiley sprites
  	let smileText = `
..bbbbbb
.bbbbbbbb
bbbyyybbbb
`;

	smiley = new Sprite();
	smiley.img = spriteArt(smileText, 32);

  

 vid = createCapture(VIDEO);
  vid.size(w, h);
  vid.hide();

   interactiveCircle = new InteractiveCircle(width / 2, height * 0.75, 50);

  // no per-scene timer start required
   
   // Randomly position collectibles on perspective lines
   randomizeCollectiblePositions();

  // Build per-round Scene 2 image lists from the preloaded assets.
  // Round 1: dr, dre, drs, drti
  // Round 2: dl, dpe, dtoi, kio
  // Round 3: kinoi, kinos, kinota, kinva
  scene2Rounds = [
    [drImage, dreImage, drsImage, drtImage],
    [dlImage, dpeImage, dtoiImage, kioImage],
    [kinoiImage, kinosImage, kinotaImage, kinvaImage]
  ];

  // Pick images for the starting round (uses per-round lists)
  selectScene2Images();
  // Apply stage images for round 1 initially
  applyStageImagesForRound(currentRound);

}
function gotFaces(results) {
  faces = results;
}

// ==============================================
// RANDOMIZE COLLECTIBLE POSITIONS
// ==============================================
/**
 * Position each collectible (beck, reck, leck, jeck) randomly along the perspective lines.
 * Each item is placed at a random depth (Y position between minY and maxY),
 * and positioned horizontally on either the left or right perspective line.
 */
function CollectiblePositions() {
  // Generate random positions for each collectible
  
  // BECK - Left line


  
  // BECK - scattered in bottom rectangle
  beck.position (90, 40);  // Random X (independent)
  //beckY = random(minYArea, maxYArea);// Random X within margins
  beck2.position (90, 40); 
  
  // Second beck
  reck2.position(90, 40); 
  reck.position(90, 40); 

  jeck.position (90, 40);
  jeck2.position (90, 40);

  

  leck.position(90, 40);
   leck2.position(90, 40);

  
  
  // RECK - scattered in bottom rectangle
 /* reckY = random(minX, maxX);
  reckX = random(minYArea, maxYArea);
  
  // Second reck
  reck2Y = random(minX, maxX);
  reck2X = random(minYArea, maxYArea);
  
  // LECK - scattered in bottom rectangle
  leckY = random(minX, maxX);
  leckX = random(minYArea, maxYArea);
  
  // Second leck
  leck2Y = random(minX, maxX);
  leck2X = random(minYArea, maxYArea);
  
  // JECK - scattered in bottom rectangle
  jeckY = random(minX, maxX);
  jeckX = random(minYArea, maxYArea);
  
  // Second jeck
  jeck2Y = random(minX, maxX);
  jeck2X = random(minYArea, maxYArea);*/
}

function checkSceneTransition() {
  if (currentScene === 1) {
    // Only auto-transition to Scene 2 when the character reaches the exit
    // AND the player has collected all required collectibles. The player
    // can still use the Skip button to move to Scene 2 earlier.
    if (character.scale < 0.2 && character.y < minY + 50) {
      let distFromCenter = abs(character.x - width / 2);
      if (distFromCenter < 40 && collectedItems >= totalCollectibles) {
        currentScene = 2;
        console.log("Scene changed! all items collected");
      }
    }
  }
}
function resetScene1() {
  // No per-scene timer to reset
  
  // Reset all collectibles
  beckVisible = true;
  reckVisible = true;
  leckVisible = true;
  jeckVisible = true;
  // Reset second copies
  beck2Visible = true;
  reck2Visible = true;
  leck2Visible = true;
  jeck2Visible = true;
  collectedItems = 0;
  
  // Randomly position collectibles on perspective lines
 /* randomizeCollectiblePositions();
  
  // Reset character position
  character.x = width / 2;
  character.y = maxY;
  character.scale = maxScale;
  
  // Reset introversion
  introversion = 100;
  
  console.log("Scene 1 reset!");
}*/

// Select 4 unique images from the pool for the current round
}
function selectScene2Images() {
  scene2Selected = [];

  // Prefer explicit per-round lists when available
  if (scene2Rounds && scene2Rounds.length >= currentRound) {
    let arr = scene2Rounds[currentRound - 1];
    if (arr && arr.length > 0) {
      for (let i = 0; i < arr.length && i < 4; i++) {
        scene2Selected.push(arr[i]);
      }
      return;
    }
  }

  // Fallback to pool behavior (shuffle & pick 4)
  if (scene2Pool.length === 0) return;
  let indices = [];
  for (let i = 0; i < scene2Pool.length; i++) indices.push(i);
  indices = shuffle(indices);
  let take = min(4, indices.length);
  for (let i = 0; i < take; i++) {
    scene2Selected.push(scene2Pool[indices[i]]);
  }
}

// ==============================================
// DRAW - Main game loop (runs continuously at 60fps)
// ==============================================

function draw() {
  // Rounds are untimed now - no elapsed/timeRemaining computation or timeout handling

  // Render current scene
  if (currentScene === 1) {
    drawScene1();
  } else if (currentScene === 2) {
    drawScene2();
  } else if (currentScene === 3) {
    drawScene3();
  } else if (currentScene === 4) {
    drawScene4();
  }

  // If we're showing the brief success display, user must press Continue button
  // (no automatic advance anymore for rounds 1-2)
  if (isShowingSuccess) {
    // Button will be drawn in drawScene3UI(), user clicks it to proceed
    // No automatic timeout — waiting for button press
  }

  // Draw round overlay (no timer)
  push();
  fill(0);
  textSize(18);
  textAlign(CENTER);
  text('Round ' + currentRound, width / 2, 22);
  pop();
}

function drawScene1() {

  character.visible = true;
  smiley.visible = true;

  
  // Draw background image (if loaded)
  if (backgroundImage) {
    image(backgroundImage, 0, 0, width, height);
  } else {
    // fallback clear color while image loads or if missing
    background(100, 150, 200);
  }
  
  // Draw collectibles UI
  push();
  fill(0);
  textSize(20);
  textAlign(CENTER);
  text("Collected: " + collectedItems + "/" + totalCollectibles, width / 2, 30);
  pop();

  // Instructional text for Scene 1 (user requested)
  push();
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(20);
  // Split into two shorter lines so it fits on most screens
  text("you have to get me", width / 2, height * 0.22);
  text("to see yourself", width / 2, height * 0.28);
  pop();

  // Draw Skip button (top-right) to allow moving to Scene 2 without collecting all items
  push();
  rectMode(CENTER);
  fill(80, 120, 255);
  stroke(0);
  strokeWeight(2);
  let skipX = width - 50;
  let skipY = 30;
  let skipW = 80;
  let skipH = 36;
  rect(skipX, skipY, skipW, skipH, 6);
  fill(0);
  noStroke();
  textSize(14);
  textAlign(CENTER, CENTER);
  text('Skip', skipX, skipY);
  pop();

  
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
        collectedItems++;
        console.log("Collision with beck! Collected:", collectedItems);
    } else {
      imageMode(CENTER);
      image(beckImage, beckX, beckY, beckSize, beckSize);
      imageMode(CORNER);
    }
  }
    // Second BECK
    if (beck2Visible && beckImage) {
      let d2 = dist(character.x, character.y, beck2X, beck2Y);
      if (d2 < beckSize / 2) {
        beck2Visible = false;
        collectedItems++;
        console.log("Collision with beck2! Collected:", collectedItems);
      } else {
        imageMode(CENTER);
        image(beckImage, beck2X, beck2Y, beckSize, beckSize);
        imageMode(CORNER);
      }
    }
    if (reckVisible && reckImage) {
    let d = dist(character.x, character.y, reckX, reckY);

    if (d < reckSize / 2) {
      reckVisible = false;
      collectedItems++;
      console.log("Collision with reck! Collected:", collectedItems);
    } else {
      imageMode(CENTER);
      image(reckImage, reckX, reckY, reckSize, reckSize);
      imageMode(CORNER);
    }

    }
    // Second RECK
    if (reck2Visible && reckImage) {
      let d2 = dist(character.x, character.y, reck2X, reck2Y);
      if (d2 < reckSize / 2) {
        reck2Visible = false;
        collectedItems++;
        console.log("Collision with reck2! Collected:", collectedItems);
      } else {
        imageMode(CENTER);
        image(reckImage, reck2X, reck2Y, reckSize, reckSize);
        imageMode(CORNER);
      }
    }

     if (leckVisible && leckImage) {
    let d = dist(character.x, character.y, leckX, leckY);

    if (d < leckSize / 2) {
      leckVisible = false;
      collectedItems++;
      console.log("Collision with leck! Collected:", collectedItems);
    } else {
      imageMode(CENTER);
      image(leckImage, leckX, leckY, leckSize, leckSize);
      imageMode(CORNER);
    }

  }
  // Second LECK
  if (leck2Visible && leckImage) {
    let d2 = dist(character.x, character.y, leck2X, leck2Y);
    if (d2 < leckSize / 2) {
      leck2Visible = false;
      collectedItems++;
      console.log("Collision with leck2! Collected:", collectedItems);
    } else {
      imageMode(CENTER);
      image(leckImage, leck2X, leck2Y, leckSize, leckSize);
      imageMode(CORNER);
    }
  }

     if (jeckVisible && jeckImage) {
    let d = dist(character.x, character.y, jeckX, jeckY);

    if (d < jeckSize / 2) {
      jeckVisible = false;
      collectedItems++;
      console.log("Collision with jeck! Collected:", collectedItems);
    } else {
      imageMode(CENTER);
      image(jeckImage, jeckX, jeckY, jeckSize, jeckSize);
      imageMode(CORNER);
    }

    }
    // Second JECK
    if (jeck2Visible && jeckImage) {
      let d2 = dist(character.x, character.y, jeck2X, jeck2Y);
      if (d2 < jeckSize / 2) {
        jeck2Visible = false;
        collectedItems++;
        console.log("Collision with jeck2! Collected:", collectedItems);
      } else {
        imageMode(CENTER);
        image(jeckImage, jeck2X, jeck2Y, jeckSize, jeckSize);
        imageMode(CORNER);
      }
    }

  drawPerspective();
  checkSceneTransition();



 
  // Step 8: Draw UI information
 drawUI();
}
  function drawScene2() {
    character.visible = false;
  smiley.visible = false;
  background(220);
 
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
  // no push() was used above, so remove stray pop()
  
  // Draw dividing line
  stroke(80);
  strokeWeight(2);
  line(0, height / 2, width, height / 2);
  
  // Update and display interactive circle in lower half
  interactiveCircle.update();
  interactiveCircle.display();
  
  // Draw stage information
  drawScene2UI();

  // Draw selected images for this round (4 images)
  if (scene2Selected && scene2Selected.length > 0) {
    let imgSize = 100;
    let positions = [width * 0.18, width * 0.38, width * 0.62, width * 0.82];
    let y = height * 0.65;
    for (let i = 0; i < scene2Selected.length; i++) {
      let img = scene2Selected[i];
      if (img) {
        imageMode(CENTER);
        image(img, positions[i], y, imgSize, imgSize);
        imageMode(CORNER);
      }
    }
  }
}

function drawScene2UI() {
  let info = interactiveCircle.getStageInfo();
  
  colorMode(RGB, 255);
  fill(0);
  noStroke();
  textSize(14);
  textAlign(CENTER);
  
  text("Touch circle to grow and evolve", width / 2, height / 2 + 30);

  // Additional instructional text requested by the user for Scene 2
  push();
  textSize(13);
  fill(0);
  textAlign(CENTER);
  // Nudge these lines way higher, closer to the round indicator at top
  text("i have different options,", width / 2, 50);
  // Break the long sentence into two lines so it wraps cleanly
  text("you still need to see different versions", width / 2, 70);
  text("of my skeleton then see yourself,", width / 2, 90);
  text("keep taping on me.", width / 2, 110);
  pop();
  
  // Show stage information at bottom
  textSize(11);
  fill(200);
  
  text("Stage: " + info.name + " (" + info.touches + " touches)", width / 2, height - 100);
  text("Evolution: " + info.progress + "%", width / 2, height - 80);
  text("Resistance: " + info.resistance + "% | Excitability: " + info.excitability + "%", width / 2, height - 60);
  
  textSize(10);
  fill(180);
  text("Infant → Child → Adult → Elder", width / 2, height - 30);
}

// ==============================================
// SCENE 3 - FACE TRACKING WITH COLORED BACKGROUND
// ==============================================
function drawScene3() {
  // Background behavior depends on `scene3UseColor`.
  if (scene3UseColor) {
    // Colored background for rounds 1 & 2
    background(scene3BGColor);
  } else {
    // No colorful background for round 3 - clear to black before showing video
    background(0);
  }
  
  // Draw the camera feed
  // Only draw the camera/video in round 3 (when we don't use a colorful background).
  // For rounds 1-2 we still run face tracking (off-screen) but do not render the video feed.
  if (!scene3UseColor && SHOW_VIDEO) {
    image(cam, 0, 0);
  }
  
  // Draw face tracking data
  if (faces.length > 0) {
    drawScene3FaceTracking();
  }
  
  // Draw Scene 3 UI
  drawScene3UI();
}

function drawScene3FaceTracking() {
  let face = faces[0];  // Get the first detected face
  
  if (!face.keypoints || face.keypoints.length === 0) return;
  
  // Get tracked keypoint (nose by default, index 1)
  let trackedKeypoint = face.keypoints[TRACKED_KEYPOINT_INDEX];
  if (!trackedKeypoint) return;
  
  // Map to screen coordinates
  cursor = cam.mapKeypoint(trackedKeypoint);
  
  // Draw large cursor circle at face position
  push();
  fill(255, 0, 255, 150);  // Magenta with transparency
  noStroke();
  ellipse(cursor.x, cursor.y, CURSOR_SIZE * 2, CURSOR_SIZE * 2);
  
  // Draw crosshair
  stroke(255, 0, 255);
  strokeWeight(3);
  line(cursor.x - 20, cursor.y, cursor.x + 20, cursor.y);
  line(cursor.x, cursor.y - 20, cursor.x, cursor.y + 20);
  pop();
  
  // Display face data coordinates
  push();
  fill(255);
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER, TOP);
  textSize(16);
  text('X: ' + cursor.x.toFixed(0) + ' | Y: ' + cursor.y.toFixed(0), 
       width / 2, 30);
  
  // Show confidence score if available
  if (cursor.z !== undefined) {
    textSize(14);
    fill(200);
    text('Confidence: ' + (cursor.z * 100).toFixed(1) + '%', width / 2, 60);
  }
  pop();
  
  // Optional: Draw all face keypoints
  if (SHOW_ALL_KEYPOINTS) {
    let allPoints = cam.mapKeypoints(face.keypoints);
    
    push();
    fill(0, 255, 0, 80);  // Green, semi-transparent
    noStroke();
    for (let point of allPoints) {
      ellipse(point.x, point.y, KEYPOINT_SIZE, KEYPOINT_SIZE);
    }
    pop();
  }
}

function drawScene3UI() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textAlign(CENTER, BOTTOM);
  textSize(16);
  
  // Status message at bottom
  if (!cam.ready) {
    text('Initializing camera...', width/2, height - 20);
  } else if (faces.length === 0) {
    text('Show your face to camera', width/2, height - 20);
  } else {
    text('Tracking face keypoint: ' + TRACKED_KEYPOINT_INDEX, width/2, height - 20);
  }

  // For rounds 1-2 show an extra instructional line per user's request
  if (currentRound < 3) {
    push();
    textSize(10);
    fill(80, 80, 80);
    textAlign(CENTER, TOP);
    // Split into shorter lines so it fits on-screen
    text("no you still have to", width/2, 80);
    text("see my skeleton more", width/2, 102);
    pop();
    
    // Add larger text asking user to continue or go to beginning
    push();
    textSize(16);
    fill(0);
    textAlign(CENTER, TOP);
    text("Go to the beginning or stay?", width / 2, height / 2 + 80);
    pop();
  }
  
  // For rounds 1-2, show Continue button during success display
  if (currentRound < 3) {
    if (isShowingSuccess) {
      // Draw Continue button in the center-bottom area
      push();
      fill(80, 200, 100);
      stroke(0);
      strokeWeight(2);
      rectMode(CENTER);
      let btnX = width / 2;
      let btnY = height - 80;
      let btnW = 120;
      let btnH = 50;
      rect(btnX, btnY, btnW, btnH, 8);
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text('Continue', btnX, btnY);
      pop();
      
      // Store button bounds for touch/click detection
      window.continueButtonBounds = {
        x: btnX - btnW / 2,
        y: btnY - btnH / 2,
        w: btnW,
        h: btnH
      };
    } else {
      // Back button (top left) when not showing success
      fill(100, 100, 255);
      stroke(0);
      strokeWeight(2);
      rectMode(CENTER);
      rect(40, 30, 70, 40, 5);
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text('Back', 40, 30);
    }
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
/*function drawPerspective() {
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
}*/

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
  fill(0);
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
/*function touchStarted() {
  // Scene 1: Skip button
  if (currentScene === 1) {
    let skipX = width - 50;
    let skipY = 30;
    let skipW = 80;
    let skipH = 36;
    if (t.x > skipX - skipW/2 && t.x < skipX + skipW/2 && t.y> skipY - skipH/2 && t.y < skipY + skipH/2) {
      // move to scene 2 immediately
      goToScene2Skip();
      return false;
    }
  }
  // Scene 3: Back button or Continue button
  if (currentScene === 3) {
    // Check for Continue button (rounds 1-2 during success)
    if (isShowingSuccess && currentRound < 3 && window.continueButtonBounds) {
      let bounds = window.continueButtonBounds;
      if (t.x > bounds.x && t.x < bounds.x + bounds.w && 
          t.y > bounds.y && t.y < bounds.y + bounds.h) {
        // Continue button pressed
        isShowingSuccess = false;
        if (currentRound < 3) {
          currentRound++;
          currentScene = 1;
          // Ensure Scene 1 is reset for the new round
          resetScene1();
          // Also pick a new set of images for Scene 2 for this round
          selectScene2Images();
          // Update the stage images to match this round
          applyStageImagesForRound(currentRound);
        } else {
          // Completed round 3 successfully -> final face-tracking-only scene
          currentScene = 4;
        }
        return false;
      }
    }
    // Check for Back button (top left, rounds 1-2 when not showing success)
    if (!isShowingSuccess && currentRound < 3) {
      if (t.x> 5 && t.x < 75 && t.y > 10 && t.y< 50) {
        currentScene = 2;
        return false;
      }
    }
  }
  
  // Scene 2: Check if touching interactive circle
  if (currentScene === 2) {
    if (interactiveCircle.contains(t.x, t.y)) {
      interactiveCircle.onTouch();
    }
  }
  
  return false;
}*/

function touchStarted() {
  console.log("touchStarted called, currentScene:", currentScene);
  
  // CRITICAL: On mobile, we MUST use the touches array, not mouseX/mouseY
  let tx, ty;
  
  if (touches && touches.length > 0) {
    // Mobile touch - this is what we need!
    tx = touches[0].x;
    ty = touches[0].y;
    console.log("Using touch coordinates:", tx, ty);
  } else {
    // Desktop fallback
    tx = mouseX;
    ty = mouseY;
    console.log("Using mouse coordinates:", tx, ty);
  }
  
  console.log("Touch/Click at:", tx, ty, "Canvas size:", width, height);

  // Scene 1 Skip button
  if (currentScene === 1) {
    let skipX = width - 50, skipY = 30, skipW = 80, skipH = 36;
    let skipLeft = skipX - skipW/2;
    let skipRight = skipX + skipW/2;
    let skipTop = skipY - skipH/2;
    let skipBottom = skipY + skipH/2;
    
    console.log("Skip button bounds:", skipLeft, skipTop, skipRight, skipBottom);
    
    if (tx > skipLeft && tx < skipRight && ty > skipTop && ty < skipBottom) {
      console.log("Skip button HIT!");
      goToScene2Skip();
      return false;
    }
  }

  // Scene 2 interactive circle
  if (currentScene === 2) {
    console.log("Checking circle at:", interactiveCircle.x, interactiveCircle.y, "radius:", interactiveCircle.currentRadius);
    if (interactiveCircle.contains(tx, ty)) {
      console.log("Circle HIT!");
      interactiveCircle.onTouch();
      return false;
    }
  }

  // Scene 3 buttons
  if (currentScene === 3 && currentRound < 3) {
    if (isShowingSuccess && window.continueButtonBounds) {
      let b = window.continueButtonBounds;
      console.log("Continue button bounds:", b);
      if (tx > b.x && tx < b.x + b.w && ty > b.y && ty < b.y + b.h) {
        console.log("Continue button HIT!");
        isShowingSuccess = false;
        currentRound++;
        currentScene = 1;
        resetScene1();
        selectScene2Images();
        applyStageImagesForRound(currentRound);
        return false;
      }
    } else if (!isShowingSuccess) {
      // Back button
      if (tx > 5 && tx < 75 && ty > 10 && ty < 50) {
        console.log("Back button HIT!");
        currentScene = 2;
        return false;
      }
    }
  }
  
  return false;
}