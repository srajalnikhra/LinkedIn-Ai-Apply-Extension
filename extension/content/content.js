console.log("===== STEP 6 RESET LOADED =====");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmailsFromPost(post) {
  const emails = new Set();

  const text = post.innerText || "";
  (text.match(emailRegex) || []).forEach(e => emails.add(e));

  post.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    const email = link.href.replace("mailto:", "").split("?")[0];
    if (email) emails.add(email);
  });

  return Array.from(emails);
}

function injectApplyButton(post, emails) {
  // prevent duplicates
  if (post.querySelector(".ai-apply-btn")) return;

  const btn = document.createElement("div");
  btn.className = "ai-apply-btn";
  btn.innerText = `Apply (AI) • ${emails.length} email(s)`;

  // VERY visible styling
  btn.style.padding = "10px";
  btn.style.margin = "8px 0";
  btn.style.background = "#0a66c2";
  btn.style.color = "#ffffff";
  btn.style.fontWeight = "600";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.textAlign = "center";

  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "OPEN_PANEL",
      emails,
      postText: post.innerText
    });
  });

  // Insert at TOP of the post
  post.prepend(btn);
}

function processPosts() {
  const posts = document.querySelectorAll("div[data-urn]");

  console.log("Posts found:", posts.length);

  posts.forEach(post => {
    const emails = extractEmailsFromPost(post);
    if (emails.length > 0) {
      injectApplyButton(post, emails);
    }
  });
}

// Initial run
processPosts();

// Observe LinkedIn dynamic loading
const observer = new MutationObserver(() => {
  processPosts();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
