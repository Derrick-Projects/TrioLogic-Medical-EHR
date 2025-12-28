document.addEventListener("DOMContentLoaded", function () {
  if (typeof flatpickr !== "undefined") {
    flatpickr("#taskDueDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      minDate: "today",
      allowInput: true,
      disableMobile: true
    });
  }
});

// Theme Toggle Functionality
(function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const root = document.documentElement;

  
  let savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    savedTheme = "light";
  }
  root.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme");
      let newTheme = "light";

      if (currentTheme === "dark") {
        newTheme = "light";
      } else {
        newTheme = "dark";
      }

      root.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) {
      return;
    }

    if (theme === "dark") {
      
      themeIcon.innerHTML =
        '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
      
      themeIcon.innerHTML =
        '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  }
})();

 
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    if (m === "&") {
      return "&amp;";
    }
    if (m === "<") {
      return "&lt;";
    }
    if (m === ">") {
      return "&gt;";
    }
    if (m === '"') {
      return "&quot;";
    }
    if (m === "'") {
      return "&#039;";
    }
    return m;
  });
}


document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const search = document.getElementById("globalSearch");
    if (search) {
      search.focus();
    }
  }
});


const today = new Date();
const calState = {
  year: today.getFullYear(),
  month: today.getMonth(),
  selectedISO: today.toISOString().split("T")[0]
};


const calendarEvents = {
  "2022-01-14": [
    { patient: "John Doe", title: "Medical checkup.", time: "10:30 AM", status: "SCHEDULED" },
    { patient: "John Doe", title: "Consultation.", time: "10:30 AM", status: "CANCELLED" },
    { patient: "John Doe", title: "Surgery.", time: "10:30 AM", status: "WAITING" },
    { patient: "John Doe", title: "Surgery.", time: "10:30 AM", status: "PENDING CONFIRMATION" },
    { patient: "John Doe", title: "Surgery.", time: "10:30 AM", status: "PENDING CONFIRMATION" }
  ]
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDate(y, m, d) {
  return String(y) + "-" + pad2(m) + "-" + pad2(d);
}

function monthLabel(y, m) {
  return new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function prettyDayMonth(iso) {
  const d = new Date(String(iso) + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function prettyFullDate(iso) {
  const d = new Date(String(iso) + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function pillClass(status) {
  const s = String(status).toLowerCase();
  if (s.indexOf("cancel") !== -1) {
    return "red";
  }
  if (s.indexOf("complet") !== -1) {
    return "green";
  }
  if (s.indexOf("no_show") !== -1 || s.indexOf("no show") !== -1) {
    return "gray";
  }
  if (s.indexOf("wait") !== -1) {
    return "amber";
  }
  if (s.indexOf("pending") !== -1) {
    return "gray";
  }
  if (s.indexOf("schedule") !== -1) {
    return "blue";
  }
  return "gray";
}


function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("calMonthLabel");
  if (!grid || !label) {
    return;
  }

  label.textContent = monthLabel(calState.year, calState.month);

  const first = new Date(calState.year, calState.month, 1);
  const offset = first.getDay(); 
  const dim = daysInMonth(calState.year, calState.month);

  const prevMonth = new Date(calState.year, calState.month - 1, 1);
  const prevDim = daysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());

  grid.innerHTML = "";

  for (let i = 0; i < 42; i++) {
    (function (index) {
      const dayNum = index - offset + 1;

      let cellY = calState.year;
      let cellM = calState.month;
      let cellD = dayNum;
      let outside = false;

      if (dayNum < 1) {
        outside = true;
        cellY = prevMonth.getFullYear();
        cellM = prevMonth.getMonth();
        cellD = prevDim + dayNum;
      } else if (dayNum > dim) {
        outside = true;
        const nxt = new Date(calState.year, calState.month + 1, 1);
        cellY = nxt.getFullYear();
        cellM = nxt.getMonth();
        cellD = dayNum - dim;
      }

      const iso = isoDate(cellY, cellM + 1, cellD);

      let hasEvent = false;
      if (calendarEvents[iso] && calendarEvents[iso].length) {
        hasEvent = true;
      }

      const weekday = new Date(String(iso) + "T00:00:00").getDay();

      const btn = document.createElement("button");
      btn.type = "button";

      let className = "calDay";
      if (outside) {
        className += " is-outside";
      }
      if (weekday === 0) {
        className += " is-sunday";
      }
      if (hasEvent) {
        className += " has-event";
      }
      if (iso === calState.selectedISO) {
        className += " is-selected";
      }

      btn.className = className;
      btn.textContent = String(cellD);
      btn.setAttribute("aria-label", prettyFullDate(iso));

      btn.addEventListener("click", function () {
        calState.selectedISO = iso;
        renderCalendar();
        openEventModal(iso);
      });

      grid.appendChild(btn);
    })(i);
  }
}

 
function bindCalendarNav() {
  const prev = document.getElementById("calPrev");
  const next = document.getElementById("calNext");

  if (prev) {
    prev.addEventListener("click", function () {
      const d = new Date(calState.year, calState.month - 1, 1);
      calState.year = d.getFullYear();
      calState.month = d.getMonth();
      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      const d = new Date(calState.year, calState.month + 1, 1);
      calState.year = d.getFullYear();
      calState.month = d.getMonth();
      renderCalendar();
    });
  }
}


function openEventModal(iso) {
  const modal = document.getElementById("eventModal");
  const title = document.getElementById("eventModalTitle");
  const body = document.getElementById("eventModalBody");
  if (!modal || !title || !body) {
    return;
  }

  title.textContent = prettyFullDate(iso);

  
  body.innerHTML =
    '<div style="text-align: center; padding: 2rem; color: #6b7280;">' +
    '<div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #2f80ed; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>' +
    '<div style="margin-top: 0.5rem;">Loading appointments...</div>' +
    "</div>";

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  // Fetch appointments for this date
  fetch("../php/get_appointments.php?filter=all", {
    credentials: "same-origin"
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (!result.success || !result.appointments) {
        body.innerHTML =
          '<div style="color:#6b7280;font-weight:700;padding:1rem;">No appointments scheduled.</div>';
        return;
      }

      
      const appointments = [];
      for (let i = 0; i < result.appointments.length; i++) {
        if (result.appointments[i].appointment_date === iso) {
          appointments.push(result.appointments[i]);
        }
      }

      if (appointments.length === 0) {
        body.innerHTML =
          '<div style="color:#6b7280;font-weight:700;padding:1rem;">No appointments scheduled.</div>';
      } else {
        const dateLabel = prettyDayMonth(iso);
        const htmlParts = [];

        for (let j = 0; j < appointments.length; j++) {
          const apt = appointments[j];
          const pill = pillClass(apt.status);
          const time = formatAppointmentTime(apt.appointment_time);
          const statusText = getAppointmentStatusText(apt.status);
          const typeText = formatAppointmentType(apt.appointment_type);

          let patientName = apt.patient_name;
          if (!patientName) {
            patientName = "Unknown Patient";
          }

          let titleText = apt.reason;
          if (!titleText) {
            titleText = typeText;
          }

          const cardHtml =
            '<div class="apptCard">' +
            '<div class="apptLeft">' +
            '<div class="apptLeft__icon" aria-hidden="true">📅</div>' +
            '<div class="apptLeft__date">' + escapeHtml(dateLabel) + "</div>" +
            '<div class="apptLeft__time">' + escapeHtml(time) + "</div>" +
            "</div>" +
            '<div class="apptMain">' +
            '<div class="apptMain__name">' + escapeHtml(patientName) + "</div>" +
            '<div class="apptMain__title">' + escapeHtml(titleText) + "</div>" +
            '<span class="apptPill ' + pill + '">' + escapeHtml(statusText) + "</span>" +
            "</div>" +
            '<button class="apptMenu" type="button" aria-label="More" onclick="viewAppointmentDetails(' + String(apt.id) + ')">•••</button>' +
            "</div>";

          htmlParts.push(cardHtml);
        }

        body.innerHTML = htmlParts.join("");
      }
    })
    .catch(function (error) {
      console.error("Error fetching appointments:", error);
      body.innerHTML =
        '<div style="color:#ef4444;font-weight:700;padding:1rem;">Failed to load appointments.</div>';
    });
}

// Helper functions for appointment display
function formatAppointmentTime(timeString) {
  if (!timeString) {
    return "-";
  }
  const parts = timeString.split(":");
  const hours = parts[0];
  const minutes = parts[1];

  const hour = parseInt(hours, 10);
  let ampm = "AM";
  if (hour >= 12) {
    ampm = "PM";
  }
  let hour12 = hour % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }

  return String(hour12) + ":" + String(minutes) + " " + ampm;
}

function getAppointmentStatusText(status) {
  const map = {
    scheduled: "SCHEDULED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    no_show: "NO SHOW"
  };

  if (map[status]) {
    return map[status];
  }

  return String(status).toUpperCase();
}

function formatAppointmentType(type) {
  if (!type) {
    return "Appointment";
  }
  const replaced = String(type).replace("_", " ");
  return replaced.replace(/\b\w/g, function (l) {
    return l.toUpperCase();
  });
}

window.viewAppointmentDetails = function (appointmentId) {
  window.location.href = "./appointments.html?id=" + String(appointmentId);
};

function closeEventModal() {
  const modal = document.getElementById("eventModal");
  if (!modal) {
    return;
  }
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function bindModalClose() {
  document.addEventListener("click", function (e) {
    const close = e.target.closest("[data-close='true']");
    if (close) {
      closeEventModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeEventModal();
    }
  });
}


function renderHealthChart() {
  const mount = document.getElementById("healthChart");
  const tip = document.getElementById("chartTip");
  if (!mount) {
    return;
  }

  const labelsY = ["Cancer", "HBP", "Arthritis", "Cardiovascular", "Asthma", "Hypertension", "Diabetes"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Aug"];

  const points = [
    { m: "Jan", v: 5 },
    { m: "Feb", v: 4 },
    { m: "Mar", v: 2 },
    { m: "Apr", v: 3, tip: { title: "Arthritis", patients: 40, untreated: 3 } },
    { m: "May", v: 4 },
    { m: "Jun", v: 1 },
    { m: "Aug", v: 3 }
  ];

  const W = 900;
  const H = 360;
  const padL = 150;
  const padR = 40;
  const padT = 20;
  const padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  function x(idx) {
    return padL + innerW * (idx / (months.length - 1));
  }

  function y(val) {
    return padT + innerH * (val / (labelsY.length - 1));
  }

  // Build vertical lines
  let vLines = "";
  for (let i = 0; i < months.length; i++) {
    vLines += '<line x1="' + x(i) + '" y1="' + padT + '" x2="' + x(i) + '" y2="' + (padT + innerH) + '" stroke="#e6e8ef" />';
  }

  // Build Y labels
  let yLabelsHtml = "";
  for (let j = 0; j < labelsY.length; j++) {
    yLabelsHtml += '<text x="' + (padL - 18) + '" y="' + (y(j) + 5) + '" text-anchor="end" font-size="16" fill="#6b7280">' + escapeHtml(labelsY[j]) + "</text>";
  }

  // Build X labels
  let xLabelsHtml = "";
  for (let k = 0; k < months.length; k++) {
    xLabelsHtml += '<text x="' + x(k) + '" y="' + (padT + innerH + 35) + '" text-anchor="middle" font-size="18" fill="#6b7280">' + escapeHtml(months[k]) + "</text>";
  }

  // Build path
  const dPathParts = [];
  for (let m = 0; m < points.length; m++) {
    const prefix = (m === 0) ? "M" : "L";
    dPathParts.push(prefix + " " + x(m) + " " + y(points[m].v));
  }
  const dPath = dPathParts.join(" ");

  const area = dPath + " L " + x(points.length - 1) + " " + (padT + innerH) + " L " + x(0) + " " + (padT + innerH) + " Z";

  // Build circles
  let circlesHtml = "";
  for (let n = 0; n < points.length; n++) {
    const r = (n === 3) ? 10 : 6;
    circlesHtml += '<circle class="chartPt" data-i="' + n + '" cx="' + x(n) + '" cy="' + y(points[n].v) + '" r="' + r + '" fill="#6aa9ff" />';
  }

  mount.innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Health Condition Overview chart">' +
    "<g>" + vLines + "</g>" +
    "<g>" + yLabelsHtml + "</g>" +
    '<path d="' + area + '" fill="rgba(47,128,237,.08)"></path>' +
    '<path d="' + dPath + '" fill="none" stroke="#9cc4ff" stroke-width="4" stroke-linecap="round"></path>' +
    circlesHtml +
    "<g>" + xLabelsHtml + "</g>" +
    "</svg>";

  if (!tip) {
    return;
  }

  const pts = mount.querySelectorAll(".chartPt");
  for (let p = 0; p < pts.length; p++) {
    (function (pt, pointIndex) {
      pt.addEventListener("mouseenter", function () {
        const pointData = points[pointIndex];

        tip.style.display = "block";
        tip.setAttribute("aria-hidden", "false");

        if (pointData.tip) {
          tip.innerHTML =
            '<div class="t">' + escapeHtml(pointData.tip.title) + "</div>" +
            '<div class="m">Patients: ' + pointData.tip.patients + "<br/>Untreated: " + pointData.tip.untreated + "</div>";
        } else {
          tip.innerHTML =
            '<div class="t">' + escapeHtml(pointData.m) + '</div><div class="m">Snapshot</div>';
        }

        const rect = mount.getBoundingClientRect();
        const cx = (Number(pt.getAttribute("cx")) / W) * rect.width;
        const cy = (Number(pt.getAttribute("cy")) / H) * rect.height;

        tip.style.left = String(cx + 12) + "px";
        tip.style.top = String(cy - 20) + "px";
      });

      pt.addEventListener("mouseleave", function () {
        tip.style.display = "none";
        tip.setAttribute("aria-hidden", "true");
      });
    })(pts[p], p);
  }
}


const currentTaskFilter = "all";

function fetchTasks(filter) {
  if (typeof filter === "undefined") {
    filter = "all";
  }

  return fetch("../php/get_tasks.php?filter=" + encodeURIComponent(filter), {
    credentials: "same-origin"
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.ok) {
        return result;
      }
      console.error("Failed to fetch tasks:", result.error);
      return null;
    })
    .catch(function (error) {
      console.error("Error fetching tasks:", error);
      return null;
    });
}

function getStatusBadgeClass(status) {
  const statusMap = {
    pending: "badge-warning",
    in_progress: "badge-info",
    completed: "badge-success",
    cancelled: "badge-secondary"
  };
  if (statusMap[status]) {
    return statusMap[status];
  }
  return "badge-secondary";
}

function getPriorityBadgeClass(priority) {
  const priorityMap = {
    high: "badge-danger",
    medium: "badge-warning",
    low: "badge-success"
  };
  if (priorityMap[priority]) {
    return priorityMap[priority];
  }
  return "badge-secondary";
}

function formatDate(dateString) {
  if (!dateString) {
    return "No due date";
  }
  const date = new Date(dateString);
  const options = { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  };
  return date.toLocaleDateString("en-US", options);
}

function updateTaskStatus(taskId, newStatus) {
  return fetch("../php/update_task_status.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, status: newStatus })
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.success) {
        return renderTasks();
      } else {
        console.error("Failed to update task:", result.message);
      }
    })
    .catch(function (error) {
      console.error("Error updating task:", error);
    });
}

function buildTaskRow(task) {
  const isCompleted = task.status === "completed";
  const statusText = String(task.status).replace("_", " ").toUpperCase();

  let nameClass = "taskName";
  if (isCompleted) {
    nameClass += " task-completed";
  }

  let editedLine = "Created";
  if (task.updated_by) {
    editedLine = "Last edited by " + escapeHtml(task.updated_by);
  }

  let dueHtml = "";
  if (task.due_date) {
    dueHtml = '<span style="margin-left: 0.5rem; font-size: 0.75rem; color: #6b7280;">Due: ' + formatDate(task.due_date) + "</span>";
  }

  let priorityHtml = "";
  if (task.priority) {
    priorityHtml = '<span class="badge ' + getPriorityBadgeClass(task.priority) + '">' + String(task.priority).toUpperCase() + "</span>";
  }

  let checkedAttr = "";
  if (isCompleted) {
    checkedAttr = "checked";
  }

  let updatedAtValue = task.updated_at;
  if (!updatedAtValue) {
    updatedAtValue = task.created_at;
  }

  return (
    '<div class="taskItem" data-task-id="' + task.id + '">' +
    '<div class="taskCheck">' +
    '<label style="position:relative;">' +
    '<input type="checkbox" ' + checkedAttr + ' onchange="handleTaskCheck(' + task.id + ', this.checked)" class="task-checkbox" />' +
    '<span class="taskBox" aria-hidden="true"></span>' +
    "</label>" +
    "</div>" +
    '<div style="flex: 1;">' +
    '<div class="' + nameClass + '">' + escapeHtml(task.title) + "</div>" +
    '<div class="taskMeta">' + editedLine + " on " + formatDateTime(updatedAtValue) + "</div>" +
    '<div class="taskStatus">' +
    '<span class="badge ' + getStatusBadgeClass(task.status) + '">' + statusText + "</span>" +
    priorityHtml + dueHtml +
    "</div>" +
    "</div>" +
    '<button class="taskLink" type="button" onclick="editTask(' + task.id + ')">' +
    '<svg style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
    '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
    "</svg>" +
    "Edit" +
    "</button>" +
    "</div>"
  );
}

function renderTasks() {
  const mount = document.getElementById("tasksMount");
  if (!mount) {
    return Promise.resolve();
  }

  
  window.currentTasksData = [];

  
  mount.innerHTML =
    '<div style="text-align: center; padding: 2rem; color: #6b7280;">' +
    '<div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #2f80ed; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>' +
    '<div style="margin-top: 0.5rem;">Loading tasks...</div>' +
    "</div>";

  return fetchTasks(currentTaskFilter).then(function (data) {
    if (!data || !data.tasks) {
      mount.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: #9ca3af;">' +
        '<svg style="width: 48px; height: 48px; margin: 0 auto; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
        '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>' +
        "</svg>" +
        '<div style="margin-top: 1rem; font-size: 0.875rem;">No tasks found</div>' +
        '<button class="btnPrimary" style="margin-top: 1rem;" onclick="showAddTaskModal()">＋ Add your first task</button>' +
        "</div>";
      return;
    }

    
    window.currentTasksData = data.tasks;

    // Group tasks by status
    const groupedTasks = {
      in_progress: [],
      pending: [],
      completed: [],
      cancelled: []
    };

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task);
      }
    }

    let html = "";

    
    if (groupedTasks.in_progress.length > 0) {
      html += '<div class="taskGroupTitle">In Progress <span style="font-weight: 400; color: #6b7280;">(' + groupedTasks.in_progress.length + ")</span></div>";
      for (let a = 0; a < groupedTasks.in_progress.length; a++) {
        html += buildTaskRow(groupedTasks.in_progress[a]);
      }
    }

    
    if (groupedTasks.pending.length > 0) {
      let styleAttr = "";
      if (html) {
        styleAttr = ' style="margin-top:14px;"';
      }
      html += '<div class="taskGroupTitle"' + styleAttr + '>Upcoming <span style="font-weight: 400; color: #6b7280;">(' + groupedTasks.pending.length + ")</span></div>";
      for (let b = 0; b < groupedTasks.pending.length; b++) {
        html += buildTaskRow(groupedTasks.pending[b]);
      }
    }

    
    if (groupedTasks.completed.length > 0) {
      html += '<div class="taskGroupTitle" style="margin-top:14px;">Completed <span style="font-weight: 400; color: #6b7280;">(' + groupedTasks.completed.length + ")</span></div>";
      const showCount = Math.min(3, groupedTasks.completed.length);
      for (let c = 0; c < showCount; c++) {
        html += buildTaskRow(groupedTasks.completed[c]);
      }
    }

    if (!html) {
      html = '<div style="text-align: center; padding: 2rem; color: #9ca3af;">No tasks in this view</div>';
    }

    mount.innerHTML = html;

    
    const footer = document.querySelector(".taskFooter span");
    if (footer && data.total > 0) {
      const showing = Math.min(10, data.total);
      footer.textContent = String(showing) + " of " + String(data.total);
    }
  });
}


window.handleTaskCheck = function (taskId, isChecked) {
  let newStatus = "pending";
  if (isChecked) {
    newStatus = "completed";
  }
  updateTaskStatus(taskId, newStatus);
};

window.editTask = function (taskId) {
  openTaskModal(taskId);
};

// Modal management functions
function openTaskModal(taskId) {
  if (typeof taskId === "undefined") {
    taskId = null;
  }

  const modal = document.getElementById("taskModal");
  const formEl = document.getElementById("taskForm");
  const title = document.getElementById("taskModalTitle");
  const submitBtnText = document.getElementById("taskSubmitText");
  const taskIdInput = document.getElementById("taskId");
  const taskTitleInput = document.getElementById("taskTitle");
  const taskDescriptionInput = document.getElementById("taskDescription");
  const taskStatusInput = document.getElementById("taskStatus");
  const taskPriorityInput = document.getElementById("taskPriority");
  const taskDueDateInput = document.getElementById("taskDueDate");

  // Reset form
  formEl.reset();
  taskIdInput.value = "";

  if (taskId) {
    
    title.textContent = "Edit Task";
    submitBtnText.textContent = "Update Task";

    let task = null;
    if (window.currentTasksData && window.currentTasksData.length) {
      for (let i = 0; i < window.currentTasksData.length; i++) {
        if (window.currentTasksData[i].id == taskId) {
          task = window.currentTasksData[i];
          break;
        }
      }
    }

    if (task) {
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title || "";
      taskDescriptionInput.value = task.description || "";
      taskStatusInput.value = task.status || "pending";
      taskPriorityInput.value = task.priority || "medium";
      taskDueDateInput.value = task.due_date || "";
    }
  } else {
    
    title.textContent = "Add New Task";
    submitBtnText.textContent = "Create Task";

    
    const todayIso = new Date().toISOString().split("T")[0];
    taskDueDateInput.value = todayIso;
  }

  modal.setAttribute("aria-hidden", "false");
}

function closeTaskModal() {
  const modal = document.getElementById("taskModal");
  modal.setAttribute("aria-hidden", "true");
}

window.showAddTaskModal = function () {
  openTaskModal();
};

// Handle form submission
document.addEventListener("DOMContentLoaded", function () {
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("taskSubmitBtn");
      const submitText = document.getElementById("taskSubmitText");
      const originalText = submitText.textContent;

      
      submitBtn.disabled = true;
      submitText.textContent = "Saving...";

      const formData = new FormData(taskForm);
      const requestData = {
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status"),
        priority: formData.get("priority"),
        due_date: formData.get("due_date") || null
      };

      // If editing, include task ID
      const taskId = formData.get("taskId");
      if (taskId) {
        requestData.id = taskId;
      }

      fetch("../php/save_task.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(requestData)
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (result.success) {
            closeTaskModal();
            return renderTasks();
          } else {
            alert(result.message || "Failed to save task");
          }
        })
        .catch(function (error) {
          console.error("Error saving task:", error);
          alert("An error occurred while saving the task");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitText.textContent = originalText;
        });
    });
  }

  
  const closers = document.querySelectorAll('[data-modal-close="taskModal"]');
  for (let i = 0; i < closers.length; i++) {
    closers[i].addEventListener("click", closeTaskModal);
  }

  
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", function () {
      openTaskModal();
    });
  }
});


function loadDoctorName() {
  const target = document.querySelector("[data-doctor-name]");
  if (!target) {
    return;
  }

  fetch("../php/me.php", { credentials: "same-origin" })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (payload) {
      if (payload.ok && payload.data && payload.data.ok && payload.data.name) {
        target.textContent = payload.data.name;
      }
    })
    .catch(function () {});
}

 
function initDashboard() {
  bindCalendarNav();
  bindModalClose();

  renderCalendar();
  renderHealthChart();
  renderTasks();
  loadDoctorName();
  initializeDashboard();
}


function fetchDashboardData() {
  return fetch("../php/get_reports_data.php", {
    credentials: "same-origin"
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.ok) {
        return result.data;
      }
      console.error("Failed to fetch dashboard data:", result.error);
      return null;
    })
    .catch(function (error) {
      console.error("Error fetching dashboard data:", error);
      return null;
    });
}

// Update dashboard stats
function updateDashboardStats(data) {
  if (!data) {
    return;
  }

  const totalPatients = data.totalPatients || 0;
  const totalConditions = data.totalConditions || 0;

  const totalPatientsEl = document.getElementById("dashTotalPatients");
  const totalConditionsEl = document.getElementById("dashTotalConditions");
  const needsAttentionEl = document.getElementById("dashNeedsAttention");

  if (totalPatientsEl) {
    totalPatientsEl.textContent = String(totalPatients);
  }
  if (totalConditionsEl) {
    totalConditionsEl.textContent = String(totalConditions);
  }

  
  const needsAttention = Math.min(totalConditions, Math.ceil(totalConditions * 0.15));
  if (needsAttentionEl) {
    needsAttentionEl.textContent = String(needsAttention);
  }
}

// Health Conditions Chart 
function createHealthChart(data) {
  const ctx = document.getElementById("healthChart");
  if (!ctx) {
    return;
  }

  const conditionsData = data.conditions || [];

  
  const topConditions = conditionsData.slice(0, 7);

  if (topConditions.length === 0) {
    return;
  }

  const labels = [];
  const counts = [];

  for (let i = 0; i < topConditions.length; i++) {
    labels.push(formatConditionName(topConditions[i].condition_code));
    counts.push(parseInt(topConditions[i].count, 10));
  }

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Patients",
          data: counts,
          borderColor: "rgba(47, 128, 237, 1)",
          backgroundColor: "rgba(47, 128, 237, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgba(106, 169, 255, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              return String(context.parsed.y) + " patients";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#6b7280" },
          grid: { color: "#e6e8ef" }
        },
        x: {
          ticks: { color: "#6b7280" },
          grid: { display: false }
        }
      }
    }
  });
}

// Format condition name from code 
function formatConditionName(code) {
  if (!code) {
    return "Unknown";
  }

  const words = String(code).replace(/_/g, " ").split(" ");
  const result = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length > 0) {
      result.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
  }

  return result.join(" ");
}

// Initialize dashboard with real data 
function initializeDashboard() {
  fetchDashboardData().then(function (data) {
    if (data) {
      updateDashboardStats(data);
      createHealthChart(data);
    }
  });
}


(function () {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      fetch("../php/logout.php", {
        method: "POST",
        credentials: "same-origin"
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            showToast("Successfully Logged out", "success");
            setTimeout(function () {
              window.location.href = "./login.html";
            }, 1500);
          } else {
            showToast("Logout failed. Please try again.", "error");
          }
        })
        .catch(function (error) {
          console.error("Logout error:", error);
          showToast("An error occurred during logout", "error");
        });
    });
  }
})();


function showToast(message, type) {
  if (typeof type === "undefined") {
    type = "info";
  }

  const toast = document.createElement("div");
  toast.className = "toast toast-" + String(type);
  toast.textContent = message;

  let bg = "#3b82f6";
  if (type === "success") {
    bg = "#10b981";
  }
  if (type === "error") {
    bg = "#ef4444";
  }

  toast.style.cssText =
    "position: fixed;" +
    "top: 20px;" +
    "right: 20px;" +
    "background: " + bg + ";" +
    "color: white;" +
    "padding: 16px 24px;" +
    "border-radius: 8px;" +
    "box-shadow: 0 4px 12px rgba(0,0,0,0.15);" +
    "font-weight: 500;" +
    "z-index: 10000;" +
    "animation: slideIn 0.3s ease;";

  document.body.appendChild(toast);

  
  if (!document.querySelector("#toast-animations")) {
    const style = document.createElement("style");
    style.id = "toast-animations";
    style.textContent =
      "@keyframes slideIn {" +
      "from { transform: translateX(400px); opacity: 0; }" +
      "to { transform: translateX(0); opacity: 1; }" +
      "}" +
      "@keyframes slideOut {" +
      "from { transform: translateX(0); opacity: 1; }" +
      "to { transform: translateX(400px); opacity: 0; }" +
      "}";
    document.head.appendChild(style);
  }

  
  setTimeout(function () {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", initDashboard);
