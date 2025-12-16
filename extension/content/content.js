// ===== LinkedIn AI Apply - content.js =====

// Clean JD text
function cleanJD(text) {
  if (!text) return "";

  return text
    .replace(/#\w+/g, "")
    .replace(/Apply Here:.*/gi, "")
    .replace(/View job/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Extract JD
function extractJDFromPost(post) {
  const textContainer =
    post.querySelector("span[dir='ltr']") ||
    post.querySelector("div.update-components-text");

  if (!textContainer) return "";
  return cleanJD(textContainer.innerText);
}

// Inject Apply button
function injectApplyButton(post) {
  if (post.querySelector(".ai-apply-btn")) return;

  const emailMatch = post.innerText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );

  if (!emailMatch) return;

  const email = emailMatch[0];
  const jdText = extractJDFromPost(post);

  const btn = document.createElement("button");
  btn.className = "ai-apply-btn";
  btn.innerText = "Apply (AI) · 1 email(s)";
  btn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  `;

  btn.onclick = () => {
    chrome.runtime.sendMessage({ type: "GET_TAB" }, (tabs) => {
      const tabId = tabs?.[0]?.id;
      if (!tabId) return;

      chrome.runtime.sendMessage({ type: "OPEN_PANEL", tabId });

      chrome.runtime.sendMessage({
        type: "UPDATE_PANEL_DATA",
        payload: {
          email,
          jdText
        }
      });
    });
  };

  post.appendChild(btn);
}

// Scan posts
function scanPosts() {
  document
    .querySelectorAll("div.feed-shared-update-v2")
    .forEach(injectApplyButton);
}

scanPosts();

new MutationObserver(scanPosts).observe(document.body, {
  childList: true,
  subtree: true
});
