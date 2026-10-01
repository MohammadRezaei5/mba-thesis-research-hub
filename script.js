const PAGE_SIZE = 10;

let allUrls = [];
let filteredUrls = [];
let currentPage = 1;
let searchQuery = "";
let isLoading = true;

window.addEventListener("DOMContentLoaded", () => {
  fetchSites();
});
async function fetchSites() {
  showLoadingState();
  try {
    const response = await fetch("sites.txt?t=" + new Date().getTime());
    if (!response.ok) {
      throw new Error(`مشکل در خواندن فایل (کد: ${response.status})`);
    }
    const text = await response.text();
    parseAndSetUrls(text);
    showToast("فایل sites.txt با موفقیت بازخوانی شد", "success");
  } catch (error) {
    console.warn(
      "عدم موفقیت در دریافت sites.txt، استفاده از داده‌های نمونه پیش‌فرض:",
      error,
    );
    parseAndSetUrls(DEFAULT_SITES.join("\n\n"));
    showToast(
      "استفاده از لیست مقالات پیش‌فرض (فایل sites.txt مستقیم یافت نشد)",
      "info",
    );
  } finally {
    isLoading = false;
  }
}
function parseAndSetUrls(rawText) {
  if (!rawText || typeof rawText !== "string") {
    allUrls = [];
  } else {
    const lines = rawText.split("\n");
    allUrls = lines
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          (line.startsWith("http://") || line.startsWith("https://")),
      );
  }
  applyFilter();
  updateStats();
}
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    return domain;
  } catch (e) {
    return "دامنه نامشخص";
  }
}
function extractPathSummary(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    return path.length > 60 ? path.substring(0, 57) + "..." : path;
  } catch (e) {
    return url;
  }
}
function applyFilter() {
  if (!searchQuery) {
    filteredUrls = [...allUrls];
  } else {
    const q = searchQuery.toLowerCase();
    filteredUrls = allUrls.filter((url) => {
      const domain = extractDomain(url).toLowerCase();
      return url.toLowerCase().includes(q) || domain.includes(q);
    });
  }
  currentPage = 1;
  renderList();
  renderPagination();
}
function handleSearch() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  searchQuery = input.value.trim();
  if (searchQuery.length > 0) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
  applyFilter();
}
function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  searchQuery = "";
  document.getElementById("clearSearchBtn").classList.add("hidden");
  applyFilter();
}
function showLoadingState() {
  isLoading = true;
  const container = document.getElementById("contentContainer");
  container.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    container.innerHTML += `
                    <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-3 w-full sm:w-2/3">
                            <div class="w-10 h-10 rounded-xl skeleton shrink-0"></div>
                            <div class="space-y-2 w-full">
                                <div class="h-4 w-1/3 skeleton rounded-md"></div>
                                <div class="h-3 w-3/4 skeleton rounded-md"></div>
                            </div>
                        </div>
                        <div class="h-9 w-28 skeleton rounded-xl shrink-0 self-end sm:self-center"></div>
                    </div>
                `;
  }
}
function renderList() {
  const container = document.getElementById("contentContainer");
  container.innerHTML = "";

  if (filteredUrls.length === 0) {
    container.innerHTML = `
                    <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
                        <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h3 class="text-base text-slate-800">هیچ مقاله‌ای یافت نشد</h3>
                        <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                            ${searchQuery ? "عبارت جستجو شده با هیچ‌یک از آدرس‌های ثبت‌شده مطابقت ندارد." : "فایل sites.txt خالی است یا هیچ لینک معتبری در آن یافت نشد."}
                        </p>
                        ${
                          searchQuery
                            ? `
                            <button onclick="clearSearch()" class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors">
                                <i class="fa-solid fa-rotate-left"></i> پاک‌سازی جستجو
                            </button>
                        `
                            : ""
                        }
                    </div>
                `;
    return;
  }

  // Calculate Pagination indices
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredUrls.length);
  const pageItems = filteredUrls.slice(startIndex, endIndex);

  pageItems.forEach((url) => {
    const domain = extractDomain(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    const cardHtml = `
                    <div class="article-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        <!-- Left Side: Icon & Details -->
                        <div class="flex items-start sm:items-center gap-3.5 min-w-0 w-full sm:w-auto flex-1">
                            
                            <!-- Favicon / Domain Icon -->
                            <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 sm:mt-0 p-1.5">
                                <img src="${faviconUrl}" alt="${domain}" class="w-full h-full object-contain" onerror="this.onerror=null; this.src='https://placehold.co/64x64/0284c7/ffffff?text=MBA';">
                            </div>

                            <!-- Text info -->
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-slate-900 text-sm sm:text-base hover:text-brand-600 transition-colors">
                                        ${escapeHtml(domain)}
                                    </span>
                                    <span class="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200/60">
                                        مقاله پژوهشی
                                    </span>
                                </div>
                                
                                <p class="text-xs text-slate-500 font-mono dir-ltr text-right truncate mt-1 hover:text-slate-700 transition-colors" title="${escapeHtml(url)}">
                                    ${escapeHtml(url)}
                                </p>
                            </div>
                        </div>

                        <!-- Right Side: Actions -->
                        <div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                            <!-- Copy Link Button -->
                            <button onclick="copyToClipboard('${escapeHtml(url)}')" title="کپی آدرس لینک" class="px-3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all flex items-center gap-1.5">
                                <i class="fa-regular fa-copy"></i>
                                <span class="hidden xl:inline">کپی</span>
                            </button>

                            <!-- Open Link Button -->
                            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 text-xs sm:text-sm text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm hover:shadow-brand-500/20 active:scale-95 transition-all inline-flex items-center gap-2">
                                <span>باز کردن</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                            </a>
                        </div>
                    </div>
                `;
    container.innerHTML += cardHtml;
  });
}
function renderPagination() {
  const infoEl = document.getElementById("paginationInfo");
  const buttonsEl = document.getElementById("paginationButtons");

  const totalItems = filteredUrls.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  if (totalItems === 0) {
    infoEl.textContent = "هیچ موردی برای نمایش وجود ندارد";
    buttonsEl.innerHTML = "";
    return;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalItems);

  infoEl.innerHTML = `نمایش <span class="font-bold text-slate-900">${startIndex}</span> تا <span class="font-bold text-slate-900">${endIndex}</span> از <span class="font-bold text-brand-700">${totalItems}</span> مقاله`;

  let btnsHtml = "";

  // Previous Button
  btnsHtml += `
                <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""} class="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <i class="fa-solid fa-chevron-right ml-1"></i> قبلی
                </button>
            `;

  // Page Number Buttons
  for (let i = 1; i <= totalPages; i++) {
    // Show first page, last page, current page, and adjacent pages
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      btnsHtml += `
                        <button onclick="changePage(${i})" class="w-8 h-8 text-xs font-bold rounded-xl border transition-all ${i === currentPage ? "bg-brand-600 text-white border-brand-600 shadow-sm" : "border-slate-200 text-slate-700 hover:bg-slate-100"}">
                            ${i}
                        </button>
                    `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      btnsHtml += `<span class="px-1 text-slate-400 text-xs">...</span>`;
    }
  }

  // Next Button
  btnsHtml += `
                <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""} class="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    بعدی <i class="fa-solid fa-chevron-left mr-1"></i>
                </button>
            `;

  buttonsEl.innerHTML = btnsHtml;
}
function changePage(newPage) {
  const totalPages = Math.ceil(filteredUrls.length / PAGE_SIZE) || 1;
  if (newPage < 1 || newPage > totalPages) return;

  currentPage = newPage;
  renderList();
  renderPagination();

  window.scrollTo({
    top: document.getElementById("searchInput").offsetTop - 100,
    behavior: "smooth",
  });
}
function updateStats() {
  const total = allUrls.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 0;

  document.getElementById("statTotalCount").textContent = total;
  document.getElementById("statPageCount").textContent = totalPages;
}
async function refreshData() {
  const icon = document.getElementById("refreshIcon");
  icon.classList.add("fa-spin");

  await fetchSites();

  setTimeout(() => {
    icon.classList.remove("fa-spin");
  }, 600);
}
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    showToast("آدرس مقاله در حافظه کپی شد", "success");
  } catch (err) {
    showToast("خطا در کپی‌برداری آدرس", "error");
  } finally {
    document.body.removeChild(textarea);
  }
}
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className =
    "toast-enter pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md p-3.5 px-4 rounded-xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium";

  let iconClass = "fa-circle-info text-blue-400";
  if (type === "success") iconClass = "fa-circle-check text-emerald-400";
  if (type === "error") iconClass = "fa-triangle-exclamation text-rose-400";

  toast.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <i class="fa-solid ${iconClass} text-base shrink-0"></i>
                    <span>${escapeHtml(message)}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

  container.appendChild(toast);

  // Auto dismiss toast
  setTimeout(() => {
    toast.classList.remove("toast-enter");
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
