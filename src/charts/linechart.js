const unpack = (data, key) => data.map((row) => row[key]);
const plotlyConfig = { responsive: true, displayModeBar: true };
const axisLabels = {
  pm2_5: 'PM2.5 (µg/m³)',
  pm10: 'PM10 (µg/m³)',
  co2: 'CO2 (ppm)',
  ta: 'Temperature (°C)',
  rh: 'Humidity (%)'
};

const initializeChart = () => {
  const chartDiv = document.getElementById('lineChart');
  if (!chartDiv) return;

  // DON'T load data immediately - wait for station selection
  document.addEventListener('zoneStationChanged', loadlineChartData);
  document.addEventListener('metricChanged', loadlineChartData);
  
  document.querySelectorAll('.metric-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(loadlineChartData, 100);
    });
  });
};

document.addEventListener('DOMContentLoaded', initializeChart);
document.addEventListener('chartContainerVisible', initializeChart);

// Update loadlineChartData to handle no selection gracefully
async function loadlineChartData() {
  const chartDiv = document.getElementById('lineChart');
  const placeholder = document.getElementById('lineChartPlaceholder');
  const chartContent = document.getElementById('lineChartContent');
  
  if (!chartDiv) return;

  const stationChosen = sessionStorage.getItem('zoneStation');
  
  if (!stationChosen) {
    // Show placeholder, hide chart
    placeholder.style.display = 'flex';
    chartContent.style.display = 'none';
    return;
  }

  try {
    // Hide placeholder, show chart
    placeholder.style.display = 'none';
    chartContent.style.display = 'block';
    
    Plotly.purge(chartContent);
    
    // Get current metric from active button
    const currentMetric = document.querySelector('.metric-btn.active')?.dataset.metric || 'pm2_5';
    
    // Load CSV data
    const data = await d3.csv("data_daily_avg.csv");
    // const data = await d3.csv("SAMBA_cleaned_data_NEW.csv");
    
    // Get selected station from session storage
    const stationChosen = sessionStorage.getItem('zoneStation');
    
    // Enhanced validation
    if (!stationChosen) {
      showError("Please select a station first");
      return;
    }

    // Robust splitting to handle zones with underscores
    const parts = stationChosen.split('_');
    if (parts.length < 2) {
      showError(`Invalid station format: ${stationChosen}`);
      return;
    }
    
    const chosenZoneId = parts.slice(0, -1).join('_'); // Handles "7_inspect"
    const chosenStationNo = parts[parts.length - 1].trim(); // Gets last part

    // Zone validation
    const validZones = new Set([
      '1_trim_1', '2_trim_2', '3_chassis_1',
      '4_chassis_2', '5_engine', '6_final', '7_inspect'
    ]);

    if (!validZones.has(chosenZoneId)) {
      showError(`Invalid zone: ${chosenZoneId}`);
      return;
    }

    // Station number validation
    if (!chosenStationNo || !/^\d+$/.test(chosenStationNo)) {
      showError(`Invalid station number: ${chosenStationNo}`);
      return;
    }

    // Filter data for selected zone and station
    const filtered = data.filter(row => 
      row.zone_id === chosenZoneId && 
      row.station_no.trim() === chosenStationNo
    );

    if (filtered.length === 0) {
      showError(`No ${currentMetric} data for ${chosenZoneId}_${chosenStationNo}`);
      return;
    }

    // Parse datetime
    const parseDateTime = d3.timeParse("%Y-%m-%d");
    // const parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const datetime = filtered
      .map(d => parseDateTime(`${d.datetime}`))
    //   .map(d => parseDateTime(`${d.created_at_date} ${d.created_at_time}`))
      .filter(d => d instanceof Date);

    // Extract and validate metric data
    const metricData = unpack(filtered, currentMetric)
      .map(Number)
      .filter(v => !isNaN(v));

    if (datetime.length === 0 || metricData.length === 0) {
      showError(`No valid ${currentMetric} data for this station`);
      return;
    }

    // Create plot data
    const plotData = [{
      x: datetime,
      y: metricData,
      type: 'scatter',
      mode: 'lines+markers',
      line: { 
        shape: 'spline', 
        smoothing: 0.3,
        color: '#2E86AB'
      },
      marker: { 
        size: 4,
        color: '#A23B72'
      },
      name: `Station ${chosenStationNo}`
    }];

    // Create layout
    const layout = {
      title: {
        text: `${chosenZoneId.replace('_', ' ').toUpperCase()} - Station ${chosenStationNo}<br>${currentMetric.toUpperCase()} Time Series`,
        font: { size: 16 }
      },
      xaxis: {
        title: {
          text: 'Time'
        },
        type: 'date',
        rangeslider: { visible: true },
        rangeselector: {
          buttons: [
            { count: 1, label: '1D', step: 'day', stepmode: 'backward' },
            { count: 7, label: '1W', step: 'day', stepmode: 'backward' },
            { count: 30, label: '1M', step: 'day', stepmode: 'backward' },
            { step: 'all' }
          ]
        }
      },
      yaxis: { 
        title: {
          text: axisLabels[currentMetric] || currentMetric.toUpperCase()
        }
      },
      margin: { t: 80, b: 60, l: 100, r: 60 }, // Increased margins
      autosize: true,
      showlegend: false
    };

    Plotly.newPlot(chartContent, plotData, layout, plotlyConfig);

  } catch (error) {
    console.error('Line chart error:', error);
    showError("Error loading chart data");
  }
}

function showError(message) {
  const container = document.getElementById('lineChart');
  if (container) {
    container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        color: #6c757d;
        font-family: Arial, sans-serif;
      ">
        <div style="text-align: center;">
          <i class="fa fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 10px;"></i>
          <div style="font-size: 1.2em;">${message}</div>
        </div>
      </div>
    `;
  } else {
    console.warn('Error container missing:', message);
  }
}

// Export for module system
export async function init() {
  console.log('Line chart init started');
  
  // Wait for container to be available
  const waitForContainer = () => {
    return new Promise((resolve) => {
      const checkContainer = () => {
        const container = document.getElementById('lineChart');
        if (container) {
          resolve(container);
        } else {
          setTimeout(checkContainer, 100);
        }
      };
      checkContainer();
    });
  };
  
  await waitForContainer();
  initializeChart();
  console.log('Line chart initialized successfully');
}