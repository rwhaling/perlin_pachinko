import p5 from "p5";
// import qrCodeImg from "./cropped_qr_whaling_dev.png";

// Parameter definitions moved from main.tsx to here
export const numericParameterDefs = {
  "timeMultiplier": {
    "min": 0,
    "max": 0.01,
    "step": 0.00001,
    "defaultValue": 0.0003, // Set to match initial value
  },
  "amplitude": {
    "min": 0,
    "max": 200,
    "step": 1,
    "defaultValue": 150,
  },
  "noiseSize": {
    "min": 0,
    "max": 100,
    "step": 1,
    "defaultValue": 80,
  },
  "noiseScale": {
    "min": 0,
    "max": 0.1,
    "step": 0.0001,
    "defaultValue": 0.0026,
  },
  "noiseDetailOctave": {
    "min": 0,
    "max": 10,
    "step": 1,
    "defaultValue": 2,
  },
  "noiseDetailFalloff": {
    "min": 0,
    "max": 1,
    "step": 0.05,
    "defaultValue": 0.5,
  },
  "innerRingSize": {
    "min": 0,
    "max": 1.0,
    "step": 0.01,
    "defaultValue": 0.6, // Set to match initial value
  },
  "outerRingSize": {
    "min": 0,
    "max": 1.0,
    "step": 0.01,
    "defaultValue": 0.75, // Set to match initial value
  },
  "bgTransparency": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 200,
  },
  "trailTransparency": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 5,
  }
};

// This type represents the parameter store structure
export type ParameterStore = {
  [K in keyof typeof numericParameterDefs]: number;
};

// Create initialization function here too
export function initParameterStore(): ParameterStore {
  // Initialize from default values in the parameter definitions
  const store = {} as ParameterStore;
  
  Object.entries(numericParameterDefs).forEach(([key, def]) => {
    store[key as keyof ParameterStore] = def.defaultValue;
  });
  
  return store;
}

// This function creates the p5 sketch
export function createSketch(parameterStore: ParameterStore) {
  return function sketch(p: p5) {
    let canvasSize: number;
    let frame_count = 0;
    let particleLayer: p5.Graphics;
    
    // Improved particle structure with vectors and previous position
    interface SimpleParticle {
      pos: p5.Vector;
      vel: p5.Vector;
      acc: p5.Vector;
      prevPos: p5.Vector;
    }
    
    // Array to store particles
    let particles: SimpleParticle[] = [];
    
    p.preload = function() {
      // can preload assets here...
    };
    
    p.setup = function() {
      // Determine the canvas size based on screen width
      canvasSize = Math.min(500, window.innerWidth - 20); // 20px buffer
      
      p.createCanvas(canvasSize, canvasSize, p.WEBGL);
      p.setAttributes({ alpha: true });
      
      // Create particle layer with same dimensions and renderer
      particleLayer = p.createGraphics(canvasSize, canvasSize, p.WEBGL);
      particleLayer.setAttributes({ alpha: true });

      p.background("#050818");
      particleLayer.clear();
    };
    
    // Handle window resizing
    p.windowResized = function() {
      // Update canvas size when window is resized
      const newSize = Math.min(500, window.innerWidth - 20);
      
      // Only resize if the size actually changed
      if (newSize !== canvasSize) {
        canvasSize = newSize;
        p.resizeCanvas(canvasSize, canvasSize);
        
        // Recreate the particle layer with new size
        particleLayer = p.createGraphics(canvasSize, canvasSize, p.WEBGL);
        particleLayer.setAttributes({ alpha: true });
        
        p.background("#050818");
      }
    };
        
    p.draw = function() {
      frame_count += 1;
      let timeMultiplier = parameterStore.timeMultiplier;
      let noiseSize = parameterStore.noiseSize;
      let noiseScale = parameterStore.noiseScale;
      let falloff = parameterStore.noiseDetailFalloff;
      let octaves = parameterStore.noiseDetailOctave;
      let bgTransparency = parameterStore.bgTransparency;
      let trailTransparency = parameterStore.trailTransparency;
   
      // Set noise detail for both canvases
      p.noiseDetail(octaves, falloff);
      particleLayer.noiseDetail(octaves, falloff);
      
      // Draw background directly on main canvas
      p.background("#050818");
      
      // Apply fade effect to particle layer
      particleLayer.push();
      particleLayer.blendMode(p.BLEND);
      let alphaHex = Math.floor(trailTransparency).toString(16).padStart(2, '0');
      particleLayer.fill("#000000" + alphaHex);
      particleLayer.noStroke();
      particleLayer.rect(-particleLayer.width/2, -particleLayer.height/2, particleLayer.width, particleLayer.height);
      particleLayer.pop();

      // get the current time
      let time = p.millis() * timeMultiplier;      

      let period = Math.PI;
      let STEPS = 85;
      const delta = period / STEPS;

      let amplitude = parameterStore.amplitude;
      let center_x = 0;
      let center_y = 0;
      let radius = 5;

      // Draw particles on the particle layer
      particleLayer.blendMode(p.BLEND);
      for (let i = 0; i < period; i+= delta) {
        let angle = i;
        let noise = p.noise(frame_count * 0.01 - angle);
        let x1 = center_x + (amplitude + Math.abs(noise) * noiseSize) * Math.sin(angle);
        let y1 = center_y + (amplitude + Math.abs(noise) * noiseSize) * Math.cos(angle);

        let x2 = center_x - (amplitude + Math.abs(noise) * noiseSize) * Math.sin(angle);
        let y2 = y1;
        let color1 = p.lerpColor(p.color("#151E3F"),p.color("#2C8C99"), 0.2 + Math.abs(p.noise(frame_count * 0.08 - angle)));
        let color2 = p.lerpColor(p.color("#151E3F"),p.color("#2C8C99"), 0.2 + Math.abs(p.noise(frame_count * 0.08 + angle + Math.PI)));
        
        particleLayer.fill(color1);
        particleLayer.noStroke();
        particleLayer.circle(x1, y1, radius);
        particleLayer.fill(color2);
        particleLayer.circle(x2, y2, radius);
      }

      // Composite the particle layer onto the main canvas
      p.push();
      p.imageMode(p.CORNER);
      p.translate(-p.width/2, -p.height/2);
      p.blendMode(p.BLEND);
      p.image(particleLayer, 0, 0, p.width, p.height);
      p.pop();
    };
  };
}