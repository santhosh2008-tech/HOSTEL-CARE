
let complaints = [];
let selectedPhoto = "";

const STORAGE_KEY = "hostelCareComplaints";

const form = document.getElementById("complaintForm");
const gallery = document.getElementById("galleryPhoto");
const preview = document.getElementById("photoPreview");

// Load saved complaints
function loadComplaints() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];

    complaints = Array.isArray(data) ? data : [];
  } catch (error) {
    complaints = [];
    alert("Unable to load saved complaints. Please check browser storage.");
  }
}

// Save complaints
function saveComplaints() {
  try {
    // Photos are not stored to avoid filling browser storage.
    const savedData = complaints.map(c => ({
      ...c,
      photo: ""
    }));

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(savedData)
    );

    return true;
  } catch (error) {
    alert("Could not save data. Please try again.");
    return false;
  }
}

// Gallery photo selection
function handlePhoto(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image!");
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    alert("Please select an image below 3 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    selectedPhoto = reader.result;

    if (!preview) return;

    preview.innerHTML = "";

    const img = document.createElement("img");
    img.src = selectedPhoto;
    img.alt = "Complaint photo";
    img.style.width = "100%";
    img.style.maxHeight = "250px";
    img.style.objectFit = "contain";

    preview.appendChild(img);
  };

  reader.onerror = function () {
    alert("Unable to load photo.");
  };

  reader.readAsDataURL(file);
}

if (gallery) {
  gallery.addEventListener("change", function () {
    handlePhoto(this.files[0]);
  });
}

// Dashboard
function updateDashboard() {
  const total = document.getElementById("total");
  const pending = document.getElementById("pending");
  const inProgress = document.getElementById("inProgress");
  const resolved = document.getElementById("resolved");

  if (total) total.textContent = complaints.length;

  if (pending) {
    pending.textContent =
      complaints.filter(c => c.status === "Pending").length;
  }

  if (inProgress) {
    inProgress.textContent =
      complaints.filter(c => c.status === "In Progress").length;
  }

  if (resolved) {
    resolved.textContent =
      complaints.filter(c => c.status === "Resolved").length;
  }
}

// Display complaints
function showComplaints() {
  const list = document.getElementById("complaintList");

  if (!list) return;

  list.innerHTML = "";

  if (complaints.length === 0) {
    list.textContent = "No complaints yet.";
    return;
  }

  complaints.forEach(c => {
    const card = document.createElement("div");
    card.className = "complaint";

    const fields = [
      ["h3", "Category: " + (c.category || "Complaint")],
      ["p", "Complaint ID: " + (c.id || "")],
      ["p", "Student: " + (c.name || "")],
      ["p", "Room: " + (c.room || "")],
      ["p", "Hostel: " + (c.hostel || "")],
      ["p", "Problem: " + (c.description || "")],
      ["p", "Date: " + (c.date || "")],
      ["p", "Time: " + (c.time || "")],
      ["p", "Status: " + (c.status || "Pending")]
    ];

    fields.forEach(([tag, value]) => {
      const element = document.createElement(tag);
      element.textContent = value;

      if (value === "Status: Pending") {
        element.style.color = "#ffbd45";
      } else if (value === "Status: Resolved") {
        element.style.color = "#4ade80";
      } else if (value === "Status: In Progress") {
        element.style.color = "#60a5fa";
      }

      card.appendChild(element);
    });

    if (c.photo) {
      const img = document.createElement("img");
      img.src = c.photo;
      img.alt = "Complaint photo";
      img.style.width = "100%";
      img.style.maxHeight = "250px";
      img.style.objectFit = "contain";

      card.appendChild(img);
    }

    list.appendChild(card);
  });
}

// Submit complaint
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("student").value.trim();
    const room = document.getElementById("room").value.trim();
    const hostel = document.getElementById("hostel").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();

    if (!name || !room || !hostel || !category || !description) {
      alert("Please fill all details!");
      return;
    }

    const now = new Date();

    const complaint = {
      id: "HC" + Date.now(),
      name,
      room,
      hostel,
      category,
      description,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN"),
      status: "Pending",
      photo: selectedPhoto
    };

    complaints.unshift(complaint);

    if (!saveComplaints()) {
      complaints.shift();
      return;
    }

    showComplaints();
    updateDashboard();

    form.reset();
    selectedPhoto = "";

    if (preview) {
      preview.innerHTML = "";
    }

    alert("Complaint submitted successfully!");
  });
}

// Initial loading
loadComplaints();
showComplaints();
updateDashboard();
