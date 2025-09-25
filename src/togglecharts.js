// This script handles the dynamic loading of modules and toggling visibility of sections
document.addEventListener("DOMContentLoaded", function() {
  const moduleCache = new Map(); // <-- Add cache here
  
  // Updated loadModule function
const loadModule = async (path, elementId) => {
  console.log(`Loading: ${path}`);
  document.getElementById('loading-spinner').style.display = "flex"; // Show spinner
  try {
    const module = await import(/* webpackIgnore: true */ path);
    console.log('Imported module:', module);
    await module.init(); // Critical await
    document.getElementById(elementId).style.display = "block";
  } catch (error) {
    console.error(`Module load failed for ${path}:`, error);
  } finally {
    document.getElementById('loading-spinner').style.display = "none"; // Hide spinner
  }
};

  document.getElementById("1_trim_1").onclick = () => {
    loadModule('./charts/map1.js', 'map-1');
    hideOtherSections(['map-1']); // Only show map initially
  };

  document.getElementById("2_trim_2").onclick = () => {
    loadModule('./charts/map2.js', 'map-2');
    hideOtherSections(['map-2']);
  };
  document.getElementById("3_chassis_1").onclick = () => {
    loadModule('./charts/map3.js', 'map-3');
    hideOtherSections(['map-3']);
  };
  document.getElementById("4_chassis_2").onclick = () => {
    loadModule('./charts/map4.js', 'map-4');
    hideOtherSections(['map-4']);
  };
  document.getElementById("5_engine").onclick = () => {
    loadModule('./charts/map5.js', 'map-5');
    hideOtherSections(['map-5']);
  };
  document.getElementById("6_final").onclick = () => {
    loadModule('./charts/map6.js', 'map-6');
    hideOtherSections(['map-6']);
  };
  document.getElementById("7_inspect").onclick = () => {
    loadModule('./charts/map7.js', 'map-7');
    hideOtherSections(['map-7']);
  };


  // Add similar handlers for other zones
  document.getElementById("ReturnToOverview").onclick = () => {
    loadModule('./charts/floorheatmap.js', 'overview-heatmap');
    hideOtherSections(['ReturnToOverview']);
  };

   document.getElementById("lineChart").onclick = () => {
    loadModule('./charts/linechart.js', 'lineChart');
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