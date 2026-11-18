
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

/* =========================================
   HOSTELCARE - WARDEN DASHBOARD
   SECTION 3: DETAILS MODAL + PHOTO
========================================= */

(function () {

    const complaintList =
        document.getElementById("complaintList");

    const detailsModal =
        document.getElementById("detailsModal");

    const modalContent =
        document.getElementById("modalContent");

    if (!complaintList || !detailsModal || !modalContent) {
        return;
    }


    // Safe HTML
    function escapeModalHTML(value) {
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


    // Show complaint details
    function showDetails(id) {

        const complaints =
            window.wardenGetComplaints();

        const complaint = complaints.find(
            c => String(c.id) === String(id)
        );

        if (!complaint) return;

        const name = escapeModalHTML(
            window.wardenGetStudentName(complaint)
        );

        const room = escapeModalHTML(
            window.wardenGetRoom(complaint)
        );

        const category = escapeModalHTML(
            complaint.category || "General"
        );

        const hostel = escapeModalHTML(
            complaint.hostel || "Not specified"
        );

        const description = escapeModalHTML(
            complaint.description || "No description"
        );

        const date = escapeModalHTML(
            complaint.date || "Date unavailable"
        );

        const time = escapeModalHTML(
            complaint.time || "Time unavailable"
        );

        const status = escapeModalHTML(
            window.wardenGetStatus(complaint)
        );

        const complaintId = escapeModalHTML(
            complaint.id || "Not available"
        );

        // Display photo only when it is an image data URL
        const photo = typeof complaint.photo === "string" &&
            /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(
                complaint.photo
            )
            ? `<img src="${complaint.photo}"
                    alt="Complaint Photo"
                    class="modal-complaint-photo">`
            : `<p>No photo attached</p>`;


        modalContent.innerHTML = `

            <div class="modal-details">

                <h2>Complaint Details</h2>

                <div class="modal-info">
                    <p><strong>Student Name:</strong> ${name}</p>

                    <p><strong>Room Number:</strong> ${room}</p>

                    <p><strong>Category:</strong> ${category}</p>

                    <p><strong>Hostel:</strong> ${hostel}</p>

                    <p><strong>Date:</strong> ${date}</p>

                    <p><strong>Time:</strong> ${time}</p>

                    <p><strong>Status:</strong> ${status}</p>

                    <p><strong>Complaint ID:</strong> ${complaintId}</p>
                </div>

                <div class="modal-description">
                    <h3>Description</h3>
                    <p>${description}</p>
                </div>

                <div class="modal-photo">
                    <h3>Attached Photo</h3>
                    ${photo}
                </div>

            </div>

        `;

        detailsModal.classList.add("show");

    }


    // View Details button
    complaintList.addEventListener("click", function (event) {

        const button = event.target.closest(
            ".view-complaint-btn"
        );

        if (!button) return;

        showDetails(button.dataset.complaintId);

    });


    // Close modal
    function closeModal() {
        detailsModal.classList.remove("show");
    }


    // Close when clicking outside modal
    function closeModalOutside(event) {

        if (event.target === detailsModal) {
            closeModal();
        }

    }


    // Expose functions
    window.showDetails = showDetails;
    window.closeModal = closeModal;
    window.closeModalOutside = closeModalOutside;

})();

/* =========================================
   HOSTELCARE - WARDEN DASHBOARD
   SECTION 4: ANALYTICS + MONTHLY CHART
========================================= */

(function () {

    const chart = document.getElementById("monthlyChart");

    if (!chart) return;

    // Convert complaint date into Date object
    function parseComplaintDate(rawDate) {

        if (!rawDate) return null;

        // DD/MM/YYYY format
        const parts = String(rawDate).match(
            /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
        );

        if (parts) {
            const date = new Date(
                Number(parts[3]),
                Number(parts[2]) - 1,
                Number(parts[1])
            );

            return isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(rawDate);

        return isNaN(date.getTime()) ? null : date;
    }


    // Monthly chart
    function renderMonthlyChart() {

        const complaints = window.wardenGetComplaints();

        const today = new Date();

        const months = [];

        for (let i = 5; i >= 0; i--) {

            const date = new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
            );

            months.push({
                label: date.toLocaleString("en", {
                    month: "short"
                }),
                year: date.getFullYear(),
                month: date.getMonth(),
                count: 0
            });

        }


        complaints.forEach(complaint => {

            const date = parseComplaintDate(complaint.date);

            if (!date) return;

            const month = months.find(m =>
                m.month === date.getMonth() &&
                m.year === date.getFullYear()
            );

            if (month) {
                month.count++;
            }

        });


        // Draw chart
        if (chart.tagName.toLowerCase() === "canvas") {

            const ctx = chart.getContext("2d");

            const width = chart.clientWidth || 600;
            const height = chart.clientHeight || 250;

            const ratio = window.devicePixelRatio || 1;

            chart.width = width * ratio;
            chart.height = height * ratio;

            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

            ctx.clearRect(0, 0, width, height);

            const padding = 35;
            const chartHeight = height - 65;
            const chartWidth = width - padding * 2;

            const maxValue = Math.max(
                1,
                ...months.map(m => m.count)
            );

            const slotWidth = chartWidth / months.length;

            ctx.font = "12px Arial";
            ctx.textAlign = "center";

            months.forEach((month, index) => {

                const barWidth = Math.min(35, slotWidth * 0.55);

                const barHeight =
                    (month.count / maxValue) * chartHeight;

                const x =
                    padding + index * slotWidth +
                    (slotWidth - barWidth) / 2;

                const y =
                    chartHeight - barHeight + 10;

                ctx.fillStyle = "#E63956";

                ctx.beginPath();

                ctx.roundRect(
                    x,
                    y,
                    barWidth,
                    Math.max(3, barHeight),
                    6
                );

                ctx.fill();

                ctx.fillStyle = "#20212A";

                ctx.fillText(
                    month.count,
                    x + barWidth / 2,
                    y - 8
                );

                ctx.fillStyle = "#777B89";

                ctx.fillText(
                    month.label,
                    x + barWidth / 2,
                    height - 15
                );

            });

        } else {

            // Fallback for a normal HTML container
            const maxValue = Math.max(
                1,
                ...months.map(m => m.count)
            );

            chart.innerHTML = months.map(month => {

                const percentage =
                    (month.count / maxValue) * 100;

                return `
                    <div style="margin:12px 0;">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            margin-bottom:5px;
                        ">
                            <span>${month.label}</span>
                            <strong>${month.count}</strong>
                        </div>

                        <div style="
                            height:9px;
                            background:#E8EAF0;
                            border-radius:10px;
                            overflow:hidden;
                        ">
                            <div style="
                                width:${percentage}%;
                                height:100%;
                                background:#E63956;
                                border-radius:10px;
                            "></div>
                        </div>
                    </div>
                `;

            }).join("");

        }


        // Resolution statistics
        const total = complaints.length;

        const resolved = complaints.filter(
            c => window.wardenGetStatus(c) === "Resolved"
        ).length;

        const rate = total > 0
            ? Math.round((resolved / total) * 100)
            : 0;

        const resolutionRate =
            document.getElementById("resolutionRate");

        const resolutionProgress =
            document.getElementById("resolutionProgress");

        const resolvedSmall =
            document.getElementById("resolvedSmall");

        const remainingSmall =
            document.getElementById("remainingSmall");

        if (resolutionRate) {
            resolutionRate.textContent = rate + "%";
        }

        if (resolutionProgress) {
            resolutionProgress.style.width = rate + "%";
        }

        if (resolvedSmall) {
            resolvedSmall.textContent = resolved;
        }

        if (remainingSmall) {
            remainingSmall.textContent = total - resolved;
        }

    }


    window.renderMonthlyChart = renderMonthlyChart;

    renderMonthlyChart();

})();

/* =========================================
   HOSTELCARE - WARDEN DASHBOARD
   SECTION 5: EXPORT + NOTIFICATIONS
   SIDEBAR + LOGOUT
========================================= */

(function () {

    const layout = document.querySelector(".layout");

    if (!layout) return;


    // =====================================
    // 1. NOTIFICATION COUNT
    // =====================================

    function updateNotificationCount() {

        const complaints = window.wardenGetComplaints();

        const pending = complaints.filter(
            c => window.wardenGetStatus(c) === "Pending"
        ).length;

        const notificationCount =
            document.getElementById("notificationCount");

        if (notificationCount) {
            notificationCount.textContent = pending;
            notificationCount.style.display =
                pending > 0 ? "inline-flex" : "none";
        }

    }


    // =====================================
    // 2. SHOW PENDING COMPLAINTS
    // =====================================

    function showPending() {

        const statusFilter =
            document.getElementById("statusFilter");

        if (statusFilter) {
            statusFilter.value = "Pending";
            statusFilter.dispatchEvent(
                new Event("change")
            );
        }

        const complaintsSection =
            document.getElementById("complaints");

        if (complaintsSection) {
            complaintsSection.scrollIntoView({
                behavior: "smooth"
            });
        }

        // Activate complaints navigation
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");

            if (link.dataset.section === "complaints") {
                link.classList.add("active");
            }
        });

    }


    // =====================================
    // 3. EXPORT CSV
    // =====================================

    function exportCSV() {

        const complaints = window.wardenGetComplaints();

        if (complaints.length === 0) {
            alert("No complaints available to export.");
            return;
        }

        const headers = [
            "Complaint ID",
            "Student Name",
            "Room",
            "Category",
            "Hostel",
            "Description",
            "Date",
            "Time",
            "Status"
        ];

        function csvEscape(value) {
            return '"' + String(value ?? "")
                .replace(/"/g, '""') + '"';
        }

        const rows = complaints.map(c => [

            c.id || "",
            window.wardenGetStudentName(c),
            window.wardenGetRoom(c),
            c.category || "",
            c.hostel || "",
            c.description || "",
            c.date || "",
            c.time || "",
            window.wardenGetStatus(c)

        ]);

        const csv = [
            headers,
            ...rows
        ].map(row =>
            row.map(csvEscape).join(",")
        ).join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "HostelCare_Complaints.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

    }


    // =====================================
    // 4. SIDEBAR TOGGLE
    // =====================================

    function toggleSidebar() {

        const sidebar =
            document.getElementById("sidebar");

        const overlay =
            document.getElementById("mobileOverlay");

        if (sidebar) {
            sidebar.classList.toggle("active");
        }

        if (overlay) {
            overlay.classList.toggle("active");
        }

    }


    // =====================================
    // 5. NAVIGATION
    // =====================================

    document.querySelectorAll(".nav-link").forEach(link => {

        link.addEventListener("click", function () {

            const sectionId = this.dataset.section;

            if (!sectionId) return;

            document.querySelectorAll(".nav-link").forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

            document.querySelectorAll(
                ".content-section"
            ).forEach(section => {
                section.classList.remove("active");
            });

            const target =
                document.getElementById(sectionId);

            if (target) {
                target.classList.add("active");
            }

            const sidebar =
                document.getElementById("sidebar");

            const overlay =
                document.getElementById("mobileOverlay");

            if (sidebar) sidebar.classList.remove("active");
            if (overlay) overlay.classList.remove("active");

        });

    });


    // =====================================
    // 6. LOGOUT
    // =====================================

    function logout() {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) return;

        window.location.href = "index.html";

    }


    // =====================================
    // 7. EXPOSE FUNCTIONS
    // =====================================

    window.updateNotificationCount = updateNotificationCount;
    window.showPending = showPending;
    window.exportCSV = exportCSV;
    window.toggleSidebar = toggleSidebar;
    window.logout = logout;


    // =====================================
    // 8. INITIALIZE
    // =====================================

    updateNotificationCount();

    const todayDate =
        document.getElementById("todayDate");

    if (todayDate) {
        todayDate.textContent =
            new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }

})();
