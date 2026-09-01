const state = {
  selectedFile: null,
  uiState: "empty",
  isEditing: false
};

const UI = {
  EMPTY: "empty",
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  EXTRACTED: "extracted"
};

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const uploadEmpty = document.getElementById("uploadEmpty");
const uploadPreview = document.getElementById("uploadPreview");
const previewImage = document.getElementById("previewImage");
const removeBtn = document.getElementById("removeBtn");
const uploadFooter = document.getElementById("uploadFooter");
const changeFileBtn = document.getElementById("changeFileBtn");
const extractBtn = document.getElementById("extractBtn");
const extractBtnLabel = document.getElementById("extractBtnLabel");
const outputEmpty = document.getElementById("outputEmpty");
const outputProcessing = document.getElementById("outputProcessing");
const outputText = document.getElementById("outputText");
const outputActions = document.getElementById("outputActions");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const editBtn = document.getElementById("editBtn");
const statusMessage = document.getElementById("statusMessage");

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";
  if (type) statusMessage.classList.add(type);
}

function validateFile(file) {
  if (!file) return false;
  return ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
}

async function compressImage(file, maxSize = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "document";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

function setExtractButtonMode(mode) {
  extractBtn.classList.remove("processing", "success");
  extractBtn.disabled = false;

  const icon = extractBtn.querySelector(".btn-icon");
  const existingSpinner = extractBtn.querySelector(".spinner");

  if (existingSpinner) existingSpinner.remove();
  if (icon) icon.classList.remove("hidden");

  if (mode === "processing") {
    extractBtn.classList.add("processing");
    extractBtn.disabled = true;
    if (icon) icon.classList.add("hidden");
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    extractBtn.insertBefore(spinner, extractBtnLabel);
    extractBtnLabel.textContent = "Processing...";
    return;
  }

  if (mode === "success") {
    extractBtn.classList.add("success");
    extractBtn.disabled = true;
    extractBtnLabel.textContent = "Text Extracted";
    return;
  }

  extractBtnLabel.textContent = "Extract Text";
}

function setUI(nextState) {
  state.uiState = nextState;

  uploadEmpty.classList.toggle("hidden", nextState !== UI.EMPTY);
  uploadPreview.classList.toggle("hidden", nextState === UI.EMPTY);
  uploadFooter.classList.toggle("hidden", nextState === UI.EMPTY);

  outputEmpty.classList.toggle("hidden", nextState !== UI.EMPTY && nextState !== UI.UPLOADED);
  outputProcessing.classList.toggle("hidden", nextState !== UI.PROCESSING);
  outputText.classList.toggle("hidden", nextState !== UI.EXTRACTED);
  outputActions.classList.toggle("hidden", nextState !== UI.EXTRACTED);

  changeFileBtn.disabled = nextState === UI.PROCESSING;
  removeBtn.disabled = nextState === UI.PROCESSING;

  if (nextState === UI.EMPTY) {
    setExtractButtonMode("default");
  } else if (nextState === UI.UPLOADED) {
    setExtractButtonMode("default");
    extractBtn.disabled = false;
  } else if (nextState === UI.PROCESSING) {
    setExtractButtonMode("processing");
  } else if (nextState === UI.EXTRACTED) {
    setExtractButtonMode("success");
  }
}

function resetOutput() {
  outputText.value = "";
  outputText.readOnly = true;
  state.isEditing = false;
  editBtn.classList.remove("active");
}

function showPreview(file) {
  if (previewImage.src && previewImage.src.startsWith("blob:")) {
    URL.revokeObjectURL(previewImage.src);
  }
  previewImage.src = URL.createObjectURL(file);
}

async function handleFileSelection(file) {
  if (!validateFile(file)) {
    setStatus("Please select a valid JPG or PNG image.", "error");
    return;
  }

  try {
    state.selectedFile = await compressImage(file);
    showPreview(state.selectedFile);
    resetOutput();
    setUI(UI.UPLOADED);
    setStatus("");
    fileInput.value = "";
  } catch {
    setStatus("Could not process the image. Try another file.", "error");
  }
}

function clearUpload() {
  if (previewImage.src && previewImage.src.startsWith("blob:")) {
    URL.revokeObjectURL(previewImage.src);
  }
  previewImage.src = "";
  state.selectedFile = null;
  resetOutput();
  setUI(UI.EMPTY);
  setStatus("");
  fileInput.value = "";
}

browseBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});

dropArea.addEventListener("click", () => fileInput.click());

changeFileBtn.addEventListener("click", () => fileInput.click());
removeBtn.addEventListener("click", clearUpload);

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove("drag-over");
  });
});

dropArea.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer.files;
  handleFileSelection(file);
});

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  handleFileSelection(file);
});

dropArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

async function extractTextFromImage() {
  if (!state.selectedFile || state.uiState === UI.PROCESSING) return;

  const formData = new FormData();
  formData.append("file", state.selectedFile);

  resetOutput();
  setUI(UI.PROCESSING);
  setStatus("");

  try {
    const response = await fetch("/api/extract-text", {
      method: "POST",
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "OCR request failed.");
    }

    const parsedText = (result.text || "").trim();

    if (!parsedText) {
      setUI(UI.UPLOADED);
      setStatus("No text was detected in the image.", "error");
      return;
    }

    outputText.value = parsedText;
    setUI(UI.EXTRACTED);
    setStatus("Text extracted successfully.", "success");
  } catch (error) {
    setUI(UI.UPLOADED);
    setStatus(error.message || "Something went wrong during OCR.", "error");
  }
}

extractBtn.addEventListener("click", extractTextFromImage);

copyBtn.addEventListener("click", async () => {
  const text = outputText.value.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Text copied to clipboard.", "success");
  } catch {
    setStatus("Copy failed. Please copy manually.", "error");
  }
});

downloadBtn.addEventListener("click", () => {
  const text = outputText.value.trim();
  if (!text) return;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "bangla-ocr-output.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);
  setStatus("Text file downloaded.", "success");
});

editBtn.addEventListener("click", () => {
  if (state.uiState !== UI.EXTRACTED) return;

  state.isEditing = !state.isEditing;
  outputText.readOnly = !state.isEditing;
  editBtn.classList.toggle("active", state.isEditing);
  outputText.focus();

  if (state.isEditing) {
    setStatus("Edit mode enabled.", "success");
  } else {
    setStatus("Edit mode disabled.", "");
  }
});

setUI(UI.EMPTY);
