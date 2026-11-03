
let complaints = [];
let selectedPhoto = "";

const form = document.getElementById("complaintForm");
const gallery = document.getElementById("galleryPhoto");
const preview = document.getElementById("photoPreview");

// Load saved complaints
function loadComplaints() {
  try {
    const saved = localStorage.getItem("hostelCareComplaints");

    if (saved) {
      const data = JSON.parse(saved);
      complaints = Array.isArray(data) ? data : [];
    }
  } catch (error) {
    complaints = [];
    alert("Unable to load saved complaints. Please check browser storage.");
  }
}

// Save complaints
function saveComplaints() {
  try {
    const savedData = complaints.map(c => ({
      ...c,
      photo: ""
    }));

    localStorage.setItem(
      "hostelCareComplaints",
      JSON.stringify(savedData)
    );

    return true;
  } catch (error) {
    alert("Could not save data. Complaint will remain visible until page reload.");
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
  document.getElementById("total").textContent = complaints.length;

  document.getElementById("pending").textContent =
    complaints.filter(c => c.status === "Pending").length;

  document.getElementById("inProgress").textContent =
    complaints.filter(c => c.status === "In Progress").length;

  document.getElementById("resolved").textContent =
    complaints.filter(c => c.status === "Resolved").length;
}

// Display complaints
function showComplaints() {
  const list = document.getElementById("complaintList");
  list.innerHTML = "";

  if (complaints.length === 0) {
    list.textContent = "No complaints yet.";
    return;
  }

  complaints.forEach(c => {
    const card = document.createElement("div");
    card.className = "complaint";

    const fields = [
      ["h3", "Category: " + c.category],
      ["p", "Complaint ID: " + c.id],
      ["p", "Student: " + c.name],
      ["p", "Room: " + c.room],
      ["p", "Hostel: " + c.hostel],
      ["p", "Problem: " + c.description],
      ["p", "Date: " + c.date],
      ["p", "Time: " + c.time],
      ["p", "Status: " + c.status]
    ];

    fields.forEach(([tag, value]) => {
      const element = document.createElement(tag);
      element.textContent = value;

      if (value === "Status: Pending") {
        element.style.color = "#fbbf24";
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

    saveComplaints();
    showComplaints();
    updateDashboard();

    form.reset();
    selectedPhoto = "";
    preview.innerHTML = "";

    alert("Complaint submitted successfully!");
  });
}

// Initial loading
loadComplaints();
showComplaints();
updateDashboard();
