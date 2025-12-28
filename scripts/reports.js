(function initTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  
  if (!themeToggle || !themeIcon) {
    return;
  }
  
  const savedTheme = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener("click", function() {
    const currentTheme = root.getAttribute("data-theme") || "light";
    let newTheme;
    if (currentTheme === "dark") {
      newTheme = "light";
    } else {
      newTheme = "dark";
    }
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    const sunIcon = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
    const moonIcon = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";
    const pathEl = themeIcon.querySelector("path");
    if (pathEl) {
      if (theme === "dark") {
        pathEl.setAttribute("d", moonIcon);
      } else {
        pathEl.setAttribute("d", sunIcon);
      }
    }
  }
})();


function loadDoctorName() {
  const target = document.querySelector("[data-doctor-name]");
  if (!target) {
    return;
  }

  fetch("../php/me.php", { credentials: "same-origin" })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function(result) {
      if (result.ok && result.data.ok && result.data.name) {
        target.textContent = result.data.name;
      }
    })
    .catch(function() {});
}

// Fetch reports data
function fetchReportsData() {
  return fetch("../php/get_reports_data.php", {
    credentials: "same-origin"
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    if (result.ok) {
      return result.data;
    } else {
      console.error("Failed to fetch reports data:", result.error);
      return null;
    }
  })
  .catch(function(error) {
    console.error("Error fetching reports data:", error);
    return null;
  });
}


function updateStatsCards(data) {
  const totalPatientsEl = document.getElementById("totalPatients");
  const totalConditionsEl = document.getElementById("totalConditions");
  const totalMedicationsEl = document.getElementById("totalMedications");
  const totalAllergiesEl = document.getElementById("totalAllergies");
  
  if (totalPatientsEl) {
    totalPatientsEl.textContent = data.totalPatients || 0;
  }
  if (totalConditionsEl) {
    totalConditionsEl.textContent = data.totalConditions || 0;
  }
  if (totalMedicationsEl) {
    totalMedicationsEl.textContent = data.totalMedications || 0;
  }
  if (totalAllergiesEl) {
    totalAllergiesEl.textContent = data.totalAllergies || 0;
  }
}


const chartColors = {
  primary: "rgba(47, 128, 237, 0.8)",
  secondary: "rgba(139, 92, 246, 0.8)",
  success: "rgba(16, 185, 129, 0.8)",
  danger: "rgba(239, 68, 68, 0.8)",
  warning: "rgba(245, 158, 11, 0.8)",
  info: "rgba(59, 130, 246, 0.8)"
};

const chartColorPalette = [
  "rgba(47, 128, 237, 0.8)",
  "rgba(139, 92, 246, 0.8)",
  "rgba(16, 185, 129, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(59, 130, 246, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(20, 184, 166, 0.8)",
  "rgba(251, 146, 60, 0.8)",
  "rgba(168, 85, 247, 0.8)"
];

let conditionsChartInstance = null;
let currentChartType = "bar";

// Create Conditions Chart
function createConditionsChart(data) {
  const ctx = document.getElementById("conditionsChart");
  if (!ctx) {
    return;
  }

  const conditionsData = data.conditions || [];
  const labels = [];
  const counts = [];
  
  for (let i = 0; i < conditionsData.length; i++) {
    labels.push(formatConditionName(conditionsData[i].condition_code));
    counts.push(parseInt(conditionsData[i].count));
  }

  let bgColors;
  let borderColors;
  if (currentChartType === "bar") {
    bgColors = chartColors.primary;
    borderColors = "rgba(47, 128, 237, 1)";
  } else {
    bgColors = chartColorPalette.slice(0, labels.length);
    borderColors = [];
    for (let j = 0; j < labels.length; j++) {
      borderColors.push(chartColorPalette[j].replace("0.8", "1"));
    }
  }

  const chartData = {
    labels: labels,
    datasets: [{
      label: "Number of Patients",
      data: counts,
      backgroundColor: bgColors,
      borderColor: borderColors,
      borderWidth: 2
    }]
  };

  let scales = {};
  if (currentChartType === "bar") {
    scales = {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    };
  }

  const config = {
    type: currentChartType,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: currentChartType === "pie",
          position: "right"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed.y || context.parsed;
              let total = 0;
              for (let k = 0; k < context.dataset.data.length; k++) {
                total += context.dataset.data[k];
              }
              const percentage = ((value / total) * 100).toFixed(1);
              return label + ": " + value + " patients (" + percentage + "%)";
            }
          }
        }
      },
      scales: scales
    }
  };

  if (conditionsChartInstance) {
    conditionsChartInstance.destroy();
  }

  conditionsChartInstance = new Chart(ctx, config);
}

// Create Medications Chart (Doughnut)
function createMedicationsChart(data) {
  const ctx = document.getElementById("medicationsChart");
  if (!ctx) {
    return;
  }

  const medicationsData = data.medications || [];
  const topMeds = medicationsData.slice(0, 5);
  
  const labels = [];
  const counts = [];
  for (let i = 0; i < topMeds.length; i++) {
    labels.push(topMeds[i].medication_name);
    counts.push(parseInt(topMeds[i].count));
  }

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: chartColorPalette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              let total = 0;
              for (let k = 0; k < context.dataset.data.length; k++) {
                total += context.dataset.data[k];
              }
              const percentage = ((value / total) * 100).toFixed(1);
              return label + ": " + value + " (" + percentage + "%)";
            }
          }
        }
      }
    }
  });
}

// Create Allergies Chart (Horizontal Bar)
function createAllergiesChart(data) {
  const ctx = document.getElementById("allergiesChart");
  if (!ctx) {
    return;
  }

  const allergiesData = data.allergies || [];
  const topAllergies = allergiesData.slice(0, 6);
  
  const labels = [];
  const counts = [];
  for (let i = 0; i < topAllergies.length; i++) {
    labels.push(formatConditionName(topAllergies[i].allergy_code));
    counts.push(parseInt(topAllergies[i].count));
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Patients",
        data: counts,
        backgroundColor: chartColors.danger,
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// Create Demographics Chart (Pie)
function createDemographicsChart(data) {
  const ctx = document.getElementById("demographicsChart");
  if (!ctx) {
    return;
  }

  const demographics = data.demographics || { male: 0, female: 0 };
  
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Male", "Female"],
      datasets: [{
        data: [demographics.male, demographics.female],
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              let total = 0;
              for (let k = 0; k < context.dataset.data.length; k++) {
                total += context.dataset.data[k];
              }
              let percentage = 0;
              if (total > 0) {
                percentage = ((value / total) * 100).toFixed(1);
              }
              return label + ": " + value + " (" + percentage + "%)";
            }
          }
        }
      }
    }
  });
}

// Populate conditions table
function populateConditionsTable(data) {
  const tbody = document.querySelector("#conditionsTable tbody");
  if (!tbody) {
    return;
  }

  const conditionsData = data.conditions || [];
  const totalPatients = data.totalPatients || 1;

  if (conditionsData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>';
    return;
  }

  let html = "";
  for (let i = 0; i < conditionsData.length; i++) {
    const condition = conditionsData[i];
    const count = parseInt(condition.count);
    const percentage = ((count / totalPatients) * 100).toFixed(1);
    let trendIcon;
    if (i % 2 === 0) {
      trendIcon = "arrow-up text-success";
    } else {
      trendIcon = "arrow-down text-danger";
    }
    
    html += '<tr>' +
      '<td>' +
        '<div class="d-flex align-items-center">' +
          '<div class="bg-primary bg-opacity-10 p-2 rounded me-2">' +
            '<i class="bi bi-heart-pulse text-primary"></i>' +
          '</div>' +
          '<strong>' + formatConditionName(condition.condition_code) + '</strong>' +
        '</div>' +
      '</td>' +
      '<td><span class="badge bg-secondary-subtle text-secondary">' + count + ' patients</span></td>' +
      '<td>' +
        '<div class="progress" style="height: 20px;">' +
          '<div class="progress-bar bg-gradient-primary" role="progressbar" style="width: ' + percentage + '%" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100">' +
            percentage + '%' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td><i class="bi bi-' + trendIcon + '"></i></td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline-primary">' +
          '<i class="bi bi-eye"></i> View' +
        '</button>' +
      '</td>' +
    '</tr>';
  }
  
  tbody.innerHTML = html;
}


function formatConditionName(code) {
  if (!code) {
    return "Unknown";
  }
  const words = code.replace(/_/g, " ").split(" ");
  const result = [];
  for (let i = 0; i < words.length; i++) {
    result.push(words[i].charAt(0).toUpperCase() + words[i].slice(1));
  }
  return result.join(" ");
}


function initializeReports() {
  loadDoctorName();
  
  fetchReportsData().then(function(data) {
    if (!data) {
      console.error("No data available");
      return;
    }

    updateStatsCards(data);
    createConditionsChart(data);
    createMedicationsChart(data);
    createAllergiesChart(data);
    createDemographicsChart(data);
    populateConditionsTable(data);
  });
}


document.addEventListener("DOMContentLoaded", function() {
  initializeReports();

  
  const chartTypeBtns = document.querySelectorAll("[data-chart-type]");
  for (let i = 0; i < chartTypeBtns.length; i++) {
    chartTypeBtns[i].addEventListener("click", function() {
      const btn = this;
      const chartType = btn.getAttribute("data-chart-type");
      currentChartType = chartType;
      
      // Toggle active state
      const allBtns = document.querySelectorAll("[data-chart-type]");
      for (let j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove("active");
      }
      btn.classList.add("active");
      
      // Recreate chart
      fetchReportsData().then(function(data) {
        if (data) {
          createConditionsChart(data);
        }
      });
    });
  }
});
