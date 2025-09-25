// This script handles the loading of modules and toggling visibility of sections
import * as map1 from './charts/map1.js';
import * as map2 from './charts/map2.js';
import * as map3 from './charts/map3.js';
import * as map4 from './charts/map4.js';
import * as map5 from './charts/map5.js';
import * as map6 from './charts/map6.js';
import * as map7 from './charts/map7.js';
import * as floorheatmap from './charts/floorheatmap.js';
import * as linechart from './charts/linechart.js';

document.addEventListener("DOMContentLoaded", function() {
  const modules = {
    'map1': map1,
    'map2': map2,
    'map3': map3,
    'map4': map4,
    'map5': map5,
    'map6': map6,
    'map7': map7,
    'floorheatmap': floorheatmap,
    'linechart': linechart
  };

  // Updated loadModule function
const loadModule = async (moduleName, elementId) => {
  console.log(`Loading: ${moduleName}`);
  document.getElementById('loading-spinner').style.display = "flex"; // Show spinner
  try {
    const module = modules[moduleName];
    console.log('Loading module:', module);
    await module.init(); // Critical await
    document.getElementById(elementId).style.display = "block";
  } catch (error) {
    console.error(`Module load failed for ${moduleName}:`, error);
  } finally {
    document.getElementById('loading-spinner').style.display = "none"; // Hide spinner
  }
};

  document.getElementById("1_trim_1").onclick = () => {
    loadModule('map1', 'map-1');
    hideOtherSections(['map-1']); // Only show map initially
  };

  document.getElementById("2_trim_2").onclick = () => {
    loadModule('map2', 'map-2');
    hideOtherSections(['map-2']);
  };
  document.getElementById("3_chassis_1").onclick = () => {
    loadModule('map3', 'map-3');
    hideOtherSections(['map-3']);
  };
  document.getElementById("4_chassis_2").onclick = () => {
    loadModule('map4', 'map-4');
    hideOtherSections(['map-4']);
  };
  document.getElementById("5_engine").onclick = () => {
    loadModule('map5', 'map-5');
    hideOtherSections(['map-5']);
  };
  document.getElementById("6_final").onclick = () => {
    loadModule('map6', 'map-6');
    hideOtherSections(['map-6']);
  };
  document.getElementById("7_inspect").onclick = () => {
    loadModule('map7', 'map-7');
    hideOtherSections(['map-7']);
  };


  // Add similar handlers for other zones
  document.getElementById("ReturnToOverview").onclick = () => {
    loadModule('floorheatmap', 'overview-heatmap');
    hideOtherSections(['ReturnToOverview']);
  };

   document.getElementById("lineChart").onclick = () => {
    loadModule('linechart', 'lineChart');
    hideOtherSections(['lineChart']);
  };

});

function hideOtherSections(exceptions = []) {
  const sections = ['overview-heatmap', 'map-1', 'map-2', 'map-3', 'map-4', 'map-5', 'map-6', 'map-7', 'lineChart'];
  sections.forEach(id => {
    if (!exceptions.includes(id)) {
      document.getElementById(id).style.display = "none";
    }
  });
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});