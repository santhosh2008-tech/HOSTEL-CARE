
/* =========================================
   HOSTELCARE - SHARED JAVASCRIPT
   Student Dashboard + Login
========================================= */


/* =========================================
   1. COMMON STORAGE
========================================= */

let complaints = [];
let selectedPhoto = "";

const STORAGE_KEY = "hostelCareComplaints";
const STUDENT_NAME_KEY = "hostelCareCurrentStudentName";


function getComplaints() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];

    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}


function saveComplaints() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(complaints)
    );

    return true;
  } catch (error) {
    showToast("Unable to save. Storage may be full.");
    return false;
  }
}


function safeText(value) {
  return String(value ?? "");
}


function escapeHTML(value) {
  return safeText(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}


function getStatus(complaint) {
  const status = safeText(complaint.status).trim();

  if (status.toLowerCase() === "resolved") {
    return "Resolved";
  }

  if (status.toLowerCase() === "in progress") {
    return "In Progress";
  }

  return "Pending";
}


function getStudentName(complaint) {
  return safeText(
    complaint.studentName || complaint.name || complaint.student
  ).trim();
}


function getRoom(complaint) {
  return safeText(
    complaint.room || complaint.roomNumber
  ).trim() || "Not available";
}


/* =========================================
   2. TOAST MESSAGE
========================================= */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.hostelCareToastTimer);

  window.hostelCareToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


/* =========================================
   3. STUDENT DASHBOARD
========================================= */

const complaintForm = document.getElementById("complaintForm");

if (complaintForm) {

  const studentInput = document.getElementById("student");
  const roomInput = document.getElementById("room");
  const categoryInput = document.getElementById("category");
  const hostelInput = document.getElementById("hostel");
  const descriptionInput = document.getElementById("description");

  const gallery = document.getElementById("galleryPhoto");
  const preview = document.getElementById("photoPreview");

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");

  const submitBtn = document.getElementById("submitBtn");


  /* LOAD SAVED STUDENT NAME */

  studentInput.value =
    localStorage.getItem(STUDENT_NAME_KEY) || "";


  /* TODAY DATE */

  const todayDate = document.getElementById("todayDate");

  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }


  /* CURRENT STUDENT COMPLAINTS */

  function getCurrentStudentComplaints() {
    const name = studentInput.value.trim().toLowerCase();

    if (!name) return [];

    return complaints.filter(complaint => {
      return getStudentName(complaint).toLowerCase() === name;
    });
  }


  /* PHOTO UPLOAD */

  function handlePhoto(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image.");
      gallery.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Please select an image below 10 MB.");
      gallery.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      const image = new Image();

      image.onload = function () {
        const canvas = document.createElement("canvas");

        const maxSize = 900;

        let width = image.width;
        let height = image.height;

        if (width > height && width > maxSize) {
          height = Math.round(height * maxSize / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * maxSize / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, width, height);

        selectedPhoto = canvas.toDataURL("image/jpeg", 0.65);

        preview.innerHTML = "";

        const img = document.createElement("img");

        img.src = selectedPhoto;
        img.alt = "Complaint photo";

        preview.appendChild(img);
        preview.style.display = "block";
      };

      image.onerror = function () {
        showToast("Unable to process this image.");
      };

      image.src = reader.result;
    };

    reader.onerror = function () {
      showToast("Unable to read the selected photo.");
    };

    reader.readAsDataURL(file);
  }


  gallery.addEventListener("change", function () {
    handlePhoto(this.files[0]);
  });


  /* UPDATE DASHBOARD */

  function updateDashboard() {
    const studentComplaints = getCurrentStudentComplaints();

    document.getElementById("total").textContent =
      studentComplaints.length;

    document.getElementById("pending").textContent =
      studentComplaints.filter(c => getStatus(c) === "Pending").length;

    document.getElementById("inProgress").textContent =
      studentComplaints.filter(c => getStatus(c) === "In Progress").length;

    document.getElementById("resolved").textContent =
      studentComplaints.filter(c => getStatus(c) === "Resolved").length;

    const name = studentInput.value.trim();

    document.getElementById("welcomeName").textContent =
      name || "Student";

    document.getElementById("profileLetter").textContent =
      name ? name.charAt(0).toUpperCase() : "S";
  }


  /* STATUS BADGE */

  function getStatusClass(status) {
    if (status === "Resolved") return "status-resolved";
    if (status === "In Progress") return "status-progress";

    return "status-pending";
  }


  /* RENDER COMPLAINTS */

  function renderComplaints() {
    const list = document.getElementById("complaintList");
    const studentComplaints = getCurrentStudentComplaints();

    if (!studentInput.value.trim()) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <strong>Enter your name</strong>
          Enter the same name used when submitting your complaints.
        </div>`;
      return;
    }

    const search = searchInput.value.trim().toLowerCase();
    const filter = statusFilter.value;

    const filtered = studentComplaints.filter(c => {
      const status = getStatus(c);

      const text = [
        getStudentName(c),
        c.category,
        c.description,
        c.hostel,
        getRoom(c),
        c.id
      ].map(safeText).join(" ").toLowerCase();

      return text.includes(search) &&
        (filter === "All" || status === filter);
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <strong>No complaints found</strong>
          No complaints match your name or search.
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(c => {
      const status = getStatus(c);
      const id = safeText(c.id || "HC-N/A");

      return `
        <div class="complaint-item">

          <div class="complaint-main">

            <div class="complaint-title">
              <h4>${escapeHTML(c.category || "General Complaint")}</h4>
              <span class="complaint-id">${escapeHTML(id)}</span>
            </div>

            <p class="complaint-description">
              ${escapeHTML(c.description || "No description")}
            </p>

            <div class="complaint-meta">
              <span>Student: ${escapeHTML(getStudentName(c) || "Not available")}</span>
              <span>Room: ${escapeHTML(getRoom(c))}</span>
              <span>${escapeHTML(c.hostel || "Hostel")}</span>
              <span>${escapeHTML(c.date || "")}</span>
            </div>

          </div>

          <div class="complaint-actions">

            <span class="status-badge ${getStatusClass(status)}">
              ${escapeHTML(status)}
            </span>

            <button
              class="details-btn"
              type="button"
              onclick="showDetails('${escapeHTML(id)}')">
              View Details →
            </button>

          </div>

        </div>`;
    }).join("");
  }


  /* DETAILS MODAL */

  window.showDetails = function (id) {
    const complaint = getCurrentStudentComplaints().find(c =>
      safeText(c.id || "HC-N/A") === id
    );

    if (!complaint) {
      showToast("Complaint not found.");
      return;
    }

    const status = getStatus(complaint);
    const content = document.getElementById("modalContent");

    content.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Complaint ID</div>
        <div class="detail-value">${escapeHTML(complaint.id || "Not available")}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Student Name</div>
        <div class="detail-value">${escapeHTML(getStudentName(complaint))}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Room Number</div>
        <div class="detail-value">${escapeHTML(getRoom(complaint))}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Category</div>
        <div class="detail-value">${escapeHTML(complaint.category || "")}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Hostel</div>
        <div class="detail-value">${escapeHTML(complaint.hostel || "")}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Description</div>
        <div class="detail-value">${escapeHTML(complaint.description || "")}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Date & Time</div>
        <div class="detail-value">
          ${escapeHTML(complaint.date || "")}
          ${escapeHTML(complaint.time || "")}
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-label">Current Status</div>
        <div class="detail-value">
          <span class="status-badge ${getStatusClass(status)}">
            ${escapeHTML(status)}
          </span>
        </div>
      </div>

      ${complaint.photo ? `
        <div class="detail-row">
          <div class="detail-label">Attached Photo</div>
          <img class="modal-photo"
            src="${escapeHTML(complaint.photo)}"
            alt="Complaint photo">
        </div>` : ""}
    `;

    document.getElementById("detailsModal").classList.add("show");
  };


  window.closeModal = function () {
    document.getElementById("detailsModal").classList.remove("show");
  };


  window.closeModalOutside = function (event) {
    if (event.target.id === "detailsModal") {
      closeModal();
    }
  };


  /* SUBMIT COMPLAINT */

  complaintForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const student = studentInput.value.trim();
    const room = roomInput.value.trim();
    const category = categoryInput.value;
    const hostel = hostelInput.value;
    const description = descriptionInput.value.trim();

    if (!student || !room || !category || !hostel || !description) {
      showToast("Please fill all required fields.");
      return;
    }

    localStorage.setItem(STUDENT_NAME_KEY, student);

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const now = new Date();

    const newComplaint = {
      id: "HC-" + Date.now(),
      name: student,
      studentName: student,
      room: room,
      category: category,
      hostel: hostel,
      description: description,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN"),
      status: "Pending",
      photo: selectedPhoto
    };

    complaints = getComplaints();
    complaints.push(newComplaint);

    const saved = saveComplaints();

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Complaint →";

    if (!saved) return;

    searchInput.value = "";
    statusFilter.value = "All";

    selectedPhoto = "";
    gallery.value = "";

    preview.innerHTML = "";
    preview.style.display = "none";

    roomInput.value = "";
    categoryInput.value = "";
    hostelInput.value = "";
    descriptionInput.value = "";

    updateDashboard();
    renderComplaints();

    showToast("Complaint submitted successfully!");

    document.getElementById("myComplaints").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });


  /* REFRESH DASHBOARD */

  window.refreshDashboard = function () {
    complaints = getComplaints();

    if (!studentInput.value.trim()) {
      studentInput.value =
        localStorage.getItem(STUDENT_NAME_KEY) || "";
    }

    updateDashboard();
    renderComplaints();

    showToast("Dashboard refreshed.");
  };


  /* LIVE NAME FILTER AND SAVE */

  studentInput.addEventListener("input", function () {
    localStorage.setItem(
      STUDENT_NAME_KEY,
      this.value.trim()
    );

    updateDashboard();
    renderComplaints();
  });


  searchInput.addEventListener("input", renderComplaints);

  statusFilter.addEventListener("change", renderComplaints);


  /* UPDATE WHEN STORAGE CHANGES IN ANOTHER TAB */

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      complaints = getComplaints();

      updateDashboard();
      renderComplaints();
    }
  });


  /* INITIAL LOAD */

  complaints = getComplaints();

  updateDashboard();
  renderComplaints();

}


/* =========================================
   4. LOGIN FUNCTIONALITY
========================================= */

const studentLoginBtn = document.getElementById("studentLoginBtn");
const showWardenLoginBtn = document.getElementById("showWardenLoginBtn");
const wardenLoginBtn = document.getElementById("wardenLoginBtn");

const wardenLoginArea = document.getElementById("wardenLoginArea");
const passwordInput = document.getElementById("wardenPassword");
const loginError = document.getElementById("loginError");


/* STUDENT LOGIN */

if (studentLoginBtn) {
  studentLoginBtn.addEventListener("click", function () {
    window.location.href = "student.html";
  });
}


/* SHOW WARDEN LOGIN */

if (showWardenLoginBtn) {
  showWardenLoginBtn.addEventListener("click", function () {
    if (wardenLoginArea) {
      wardenLoginArea.hidden = false;
    }

    showWardenLoginBtn.hidden = true;

    if (passwordInput) {
      passwordInput.focus();
    }
  });
}


/* WARDEN LOGIN */

function checkWardenLogin() {
  if (!passwordInput || !loginError) return;

  const password = passwordInput.value;

  // Prototype-only client-side password check.
  if (password === "Hostel@123") {
    window.location.href = "warden.html";
  } else {
    loginError.textContent =
      "Incorrect password. Please try again.";

    passwordInput.value = "";
    passwordInput.focus();
  }
}


if (wardenLoginBtn) {
  wardenLoginBtn.addEventListener("click", checkWardenLogin);
}


if (passwordInput) {
  passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      checkWardenLogin();
    }
  });
}
  
/* =========================================
   HOSTELCARE - WARDEN DASHBOARD
   SECTION 1: DATA + DASHBOARD COUNTS
========================================= */

(function () {

    // Warden page check
    const wardenPage = document.querySelector(".layout");

    if (!wardenPage) return;

    // Get complaints from shared storage
    function wardenGetComplaints() {
        try {
            const saved = localStorage.getItem("hostelCareComplaints");
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Complaint loading error:", error);
            return [];
        }
    }

    // Save complaints
    function wardenSaveComplaints(data) {
        localStorage.setItem(
            "hostelCareComplaints",
            JSON.stringify(data)
        );
    }

    // Get complaint status
    function wardenGetStatus(complaint) {
        const status = String(
            complaint.status || "Pending"
        ).toLowerCase().trim();

        if (status === "resolved") return "Resolved";

        if (
            status === "in progress" ||
            status === "in-progress"
        ) {
            return "In Progress";
        }

        return "Pending";
    }

    // Get student name
    function wardenGetStudentName(complaint) {
        return complaint.name ||
               complaint.studentName ||
               "Unknown Student";
    }

    // Get room number
    function wardenGetRoom(complaint) {
        return complaint.room ||
               complaint.roomNo ||
               "Not specified";
    }

    // Update dashboard counts
    function updateDashboard() {

        const complaints = wardenGetComplaints();

        const total = complaints.length;

        const pending = complaints.filter(
            c => wardenGetStatus(c) === "Pending"
        ).length;

        const inProgress = complaints.filter(
            c => wardenGetStatus(c) === "In Progress"
        ).length;

        const resolved = complaints.filter(
            c => wardenGetStatus(c) === "Resolved"
        ).length;

        const totalElement =
            document.getElementById("total");

        const pendingElement =
            document.getElementById("pending");

        const progressElement =
            document.getElementById("inProgress");

        const resolvedElement =
            document.getElementById("resolved");

        if (totalElement)
            totalElement.textContent = total;

        if (pendingElement)
            pendingElement.textContent = pending;

        if (progressElement)
            progressElement.textContent = inProgress;

        if (resolvedElement)
            resolvedElement.textContent = resolved;

    }

    // Make functions available to next sections
    window.updateDashboard = updateDashboard;
    window.wardenGetComplaints = wardenGetComplaints;
    window.wardenSaveComplaints = wardenSaveComplaints;
    window.wardenGetStatus = wardenGetStatus;
    window.wardenGetStudentName = wardenGetStudentName;
    window.wardenGetRoom = wardenGetRoom;

    // Initial dashboard update
    updateDashboard();

})();

/* =========================================
   HOSTELCARE - WARDEN DASHBOARD
   SECTION 2: COMPLAINTS + STATUS UPDATE
========================================= */

(function () {

    const complaintList =
        document.getElementById("complaintList");

    if (!complaintList) return;

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    // Safe HTML text
    function wardenEscapeHTML(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[char]
        );
    }


    // Display complaints
    function renderComplaints() {

        const complaints = window.wardenGetComplaints();

        const search = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "All";

        const filtered = complaints
            .map((complaint, index) => ({
                ...complaint,
                originalIndex: index
            }))
            .filter(complaint => {

                const name =
                    window.wardenGetStudentName(complaint);

                const room =
                    window.wardenGetRoom(complaint);

                const searchText = [
                    name,
                    room,
                    complaint.hostel,
                    complaint.category,
                    complaint.description,
                    complaint.id
                ].join(" ").toLowerCase();

                const matchesSearch =
                    searchText.includes(search);

                const matchesStatus =
                    selectedStatus === "All" ||
                    window.wardenGetStatus(complaint) === selectedStatus;

                return matchesSearch && matchesStatus;
            })
            .reverse();


        if (filtered.length === 0) {
            complaintList.innerHTML = `
                <div class="empty-state">
                    <h3>No Complaints Found</h3>
                    <p>There are no complaints matching your search.</p>
                </div>
            `;
            return;
        }


        complaintList.innerHTML = filtered.map(c => {

            const name = wardenEscapeHTML(
                window.wardenGetStudentName(c)
            );

            const room = wardenEscapeHTML(
                window.wardenGetRoom(c)
            );

            const category = wardenEscapeHTML(
                c.category || "General"
            );

            const hostel = wardenEscapeHTML(
                c.hostel || "Not specified"
            );

            const description = wardenEscapeHTML(
                c.description || "No description"
            );

            const date = wardenEscapeHTML(
                c.date || "Date unavailable"
            );

            const status =
                window.wardenGetStatus(c);

            const complaintId =
                wardenEscapeHTML(c.id || "");

            return `
                <div class="complaint-card">

                    <div class="complaint-header">
                        <div>
                            <h3>${name}</h3>
                            <p>Room: ${room}</p>
                        </div>

                        <span class="status-badge">
                            ${status}
                        </span>
                    </div>

                    <div class="complaint-details">
                        <p><strong>Category:</strong> ${category}</p>
                        <p><strong>Hostel:</strong> ${hostel}</p>
                        <p><strong>Date:</strong> ${date}</p>
                        <p>${description}</p>
                    </div>

                    <div class="complaint-actions">

                        <select
                            class="warden-status-select"
                            data-complaint-id="${complaintId}"
                        >
                            <option value="Pending"
                                ${status === "Pending" ? "selected" : ""}>
                                Pending
                            </option>

                            <option value="In Progress"
                                ${status === "In Progress" ? "selected" : ""}>
                                In Progress
                            </option>

                            <option value="Resolved"
                                ${status === "Resolved" ? "selected" : ""}>
                                Resolved
                            </option>
                        </select>

                        <button
                            type="button"
                            class="view-complaint-btn"
                            data-complaint-id="${complaintId}"
                        >
                            View Details
                        </button>

                    </div>

                </div>
            `;

        }).join("");

    }


    // Update complaint status
    function updateWardenStatus(id, newStatus) {

        const complaints = window.wardenGetComplaints();

        const index = complaints.findIndex(
            c => String(c.id) === String(id)
        );

        if (index === -1) return;

        complaints[index].status = newStatus;

        window.wardenSaveComplaints(complaints);

        renderComplaints();

        window.updateDashboard();

    }


    // Status change event
    complaintList.addEventListener("change", function (event) {

        if (!event.target.classList.contains(
            "warden-status-select"
        )) return;

        const id = event.target.dataset.complaintId;

        updateWardenStatus(id, event.target.value);

    });


    // Search and filter
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderComplaints
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderComplaints
        );
    }


    // Expose function
    window.renderComplaints = renderComplaints;

    // Initial render
    renderComplaints();

})();
