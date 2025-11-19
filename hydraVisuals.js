let  hydraCanvas, hydra; 

function setupHydra() {
    hydraCanvas = document.createElement('canvas');
    hydraCanvas.id='hydra-camvas';
    hydraCanvas.width = window.innerWidth;
    hydraCanvas.height = window.innerHeight;
    hydraCanvas.style.position = 'absolute';
    hydraCanvas.style.top = '0px';
    hydraCanvas.style.left = '0px';
    hydraCanvas.style.zIndex = '0';


     const p5Canvas = document.getElementById('defaultCanvas0');
  if (p5Canvas && p5Canvas.parentNode) {
    p5Canvas.parentNode.insertBefore(hydraCanvas, p5Canvas);
  } else {
    document.body.appendChild(hydraCanvas);
  }

  hydra= new Hydra ({
    canvas: hydraCanvas,
    detectAudio: false,
    enableStreamCapture: false,
  });


  osc(
    () => map(character?.y?? height/2, minY, maxY, 2, 40),
     0.2,
      () => map(introversion || 100, 0, 100, 0.5, 2) 
  )
  .color(
      () => map(introversion || 100, 0, 100, 0, 1),  // red
      0.4,  // green (fixed)
      1.0   // blue (fixed)
    )
    .modulate(
      noise(4),  // noise frequency fixed at 4
      () => map(currentLevel || 0, 0, 1, 0, 0.5)
    )
     .modulate(
      voronoi(5),  // cell size fixed at 5
      () => map(currentLevel || 0, 0, 1, 0, 0.3)
    )
    .modulate(
      noise(() => time * 0.5),  // animates at half-speed
      () => map(currentLevel || 0, 0, 1, 0, 0.4)
    )
     .pixelate(
      () => map(character?.y ?? height/2, minY, maxY, 1, 20),  // X pixelation
      () => map(character?.y ?? height/2, minY, maxY, 1, 20)   // Y pixelation
    )
    .out();
}

function drawHydra(){
  
}