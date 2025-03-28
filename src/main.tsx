import p5 from "p5";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createSketch, numericParameterDefs, initParameterStore, ParameterStore } from "./sketch";
import { createSketch as createWaterSketch, numericParameterDefs as waterNumericParameterDefs, initParameterStore as initWaterParameterStore } from "./water";
import { createSketch as createCrimsonSketch, numericParameterDefs as crimsonNumericParameterDefs, initParameterStore as initCrimsonParameterStore } from "./flow_field_test";
import { createSketch as createQrSketch6, numericParameterDefs as qrNumericParameterDefs6, initParameterStore as initQrParameterStore6 } from "./broken_qr_1";
import { createSketch as createPrintSketch1, numericParameterDefs as printNumericParameterDefs1, initParameterStore as initPrintParameterStore1 } from "./print_sketch_1";
// Define sketch types for organization
type SketchType = "default" | "crimson";

// Create a global function to cycle sketches that can be called from outside React
let cycleSketch: () => void = () => {};

// Add this type definition before your sketchConfigs object
type ParameterDefinition = {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

// Update your sketch configuration type
type SketchConfig = {
  name: string;
  title: string;
  createSketch: Function;
  parameterDefs: Record<string, ParameterDefinition>;
  initStore: () => any;
};

// Create a map of sketch configurations
const sketchConfigs: Record<string, SketchConfig> = {
  default: {
    name: "Water Sketch",
    title: "this is a water sketch",
    createSketch: createWaterSketch,
    parameterDefs: waterNumericParameterDefs,
    initStore: initWaterParameterStore
  },
  test: {
    name: "Test Flow Field",
    title: "this is just a flow field",
    createSketch: createCrimsonSketch,
    parameterDefs: crimsonNumericParameterDefs,
    initStore: initCrimsonParameterStore
  },
  qr: {
    name: "QR Code 1",
    title: "this is a a print sketch",
    createSketch,
    parameterDefs: numericParameterDefs,
    initStore: initParameterStore
  },
  print1: {
    name: "Print Sketch 1",
    title: "this is a print sketch",
    createSketch: createPrintSketch1,
    parameterDefs: printNumericParameterDefs1,
    initStore: initPrintParameterStore1
  },
  qr6: {
    name: "Broken QR Code 1",
    title: "this is not a valid QR Code",
    createSketch: createQrSketch6,
    parameterDefs: qrNumericParameterDefs6,
    initStore: initQrParameterStore6
  },
};

// Create initial parameter store
let parameterStore = initParameterStore();
let p5Instance: p5;

// Entrypoint code
function main(rootElement: HTMLElement) {
  // Create a p5 instance in instance mode
  p5Instance = new p5(createSketch(parameterStore), rootElement);
}

// Split the React component into two parts: Title and Controls
function TitleComponent() {
  const [sketchType, setSketchType] = useState<SketchType>("default");

  // Function to cycle to next sketch
  const cycleToNextSketch = () => {
    const sketchTypes = Object.keys(sketchConfigs) as SketchType[];
    const currentIndex = sketchTypes.indexOf(sketchType);
    const nextIndex = (currentIndex + 1) % sketchTypes.length;
    setSketchType(sketchTypes[nextIndex]);
  };

  // Assign the global function to our React component's function
  cycleSketch = cycleToNextSketch;

  // Add global click handler
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      // Check if the click target is a UI element
      const target = e.target as HTMLElement;
      const isUIElement =
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.closest('.controls-panel') ||
        target.classList.contains('next-sketch-button');

      // If it's not a UI element, cycle to the next sketch
      if (!isUIElement) {
        cycleToNextSketch();
      }
    }

    // Add event listener
    // document.addEventListener('click', handleDocumentClick);

    // Clean up
    // return () => {
    //   document.removeEventListener('click', handleDocumentClick);
    // };
  }, [sketchType]); // Re-attach when sketch type changes

  // Get the current title from the sketchConfig
  const currentTitle = sketchConfigs[sketchType].title;

  // Update the document title when the sketch changes
  useEffect(() => {
    document.title = currentTitle;
  }, [currentTitle]);

  useEffect(() => {
    const config = sketchConfigs[sketchType];

    const newParams = config.initStore();

    parameterStore = newParams;

    if (p5Instance) {
      p5Instance.remove();
    }

    p5Instance = new p5(config.createSketch(parameterStore), rootEl!);

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [sketchType]);

  return (
    <div className="title-container">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        {currentTitle}
      </h1>
      <h3 className="text-sm font-medium text-center mb-8 text-gray-600">
        click to advance
      </h3>
    </div>
  );
}

function TestApp() {
  const [showParams, setShowParams] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
  });

  // Get current sketch type from global state
  const [numericParameters, setNumericParameters] = useState(initParameterStore());

  useEffect(() => {
    const url = new URL(window.location.href);
    if (showParams) {
      url.searchParams.set('debug', 'true');
    } else {
      url.searchParams.delete('debug');
    }
    window.history.replaceState({}, '', url);
  }, [showParams]);

  // Only render the controls panel if showParams is true
  if (!showParams) {
    return null;
  }

  // Determine which sketch is currently active - fixed to avoid TypeScript error
  const currentSketchType = Object.keys(sketchConfigs).find(key => {
    // Instead of checking _setupDone, check if p5Instance exists
    return p5Instance != null;
  }) as SketchType || "default";

  const currentParameterDefs = sketchConfigs[currentSketchType].parameterDefs;

  return (
    <>
      {/* Add the next sketch button */}
      <button
        className="next-sketch-button"
        onClick={cycleSketch}
      >
        Next Sketch
      </button>

      <div className="controls-panel">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex-grow">
            <label htmlFor="sketch-selector" className="block text-gray-700 font-medium mb-2">
              Select Sketch
            </label>
            <select
              id="sketch-selector"
              value={currentSketchType}
              onChange={(e) => {
                const newType = e.target.value as SketchType;
                cycleSketch(); // This will change the global sketch
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(sketchConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowParams(!showParams)}
            className="ml-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {showParams ? 'Hide Parameters' : 'Show Parameters'}
          </button>
        </div>

        <h2 className="text-xl font-bold mb-6 text-gray-700">Parameters</h2>
        {Object.entries(currentParameterDefs).map(([key, value]) => (
          <div key={key} className="mb-4 flex items-center gap-4">
            <label className="w-32 font-medium text-gray-700">{key}</label>
            <input
              type="range"
              min={value.min}
              max={value.max}
              step={value.step}
              value={numericParameters[key as keyof typeof numericParameters]}
              className="flex-grow"
              onChange={(e) => {
                console.log(e.target.value, typeof e.target.value);
                const newValue = parseFloat(e.target.value);
                setNumericParameters({...numericParameters, [key]: newValue});
                parameterStore[key as keyof typeof parameterStore] = newValue;
              }}
            />
            <span className="w-16 text-right text-gray-600">
              {numericParameters[key as keyof typeof numericParameters]}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// Render the title component to the title-root div
const titleContainer = document.getElementById("title-root");
if (titleContainer) {
  const titleRoot = createRoot(titleContainer);
  titleRoot.render(<TitleComponent />);
}

// Render the controls to the original react-root div
const container = document.getElementById("react-root");
if (!container) {
  throw new Error("Cannot find element root #react-root");
}
const root = createRoot(container);
root.render(<TestApp />);

// Initialize the P5 instance
const rootEl = document.getElementById("p5-root");
if (!rootEl) {
  throw new Error("Cannot find element root #p5-root");
}
main(rootEl);
