// ==============================
// LinkedIn AI Apply - Background
// ==============================

const injectedTabs = new Set();
const LOG_PREFIX = "[LinkedIn-AI]";

async function injectLinkedInScript(tabId) {
  if (injectedTabs.has(tabId)) {
    console.log(`${LOG_PREFIX} Script already injected in tab`, tabId);
    return;
  }

  try {
    console.log(`${LOG_PREFIX} Injecting script into tab`, tabId);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (window.linkedinAIInjected) return;
        window.linkedinAIInjected = true;

        console.log("[LinkedIn-AI][Content] Script activated");

        function findEmailsInPage() {
          const emailRegex =
            /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
          );

          const results = [];
          let node;

          while ((node = walker.nextNode())) {
            const emails = node.textContent.match(emailRegex);
            if (!emails) continue;

            let parent = node.parentElement;
            let depth = 0;

            while (parent && depth < 10) {
              const text = parent.innerText || "";

              if (
                text.length > 100 &&
                (text.includes("Like") ||
                  text.includes("Comment") ||
                  text.includes("Repost"))
              ) {
                // 🔥 HOME FIX: normalize to real feed post if present
                const realPost =
                  parent.closest(".feed-shared-update-v2") || parent;

                if (!realPost.dataset.aiApplyInjected) {
                  realPost.dataset.aiApplyInjected = "true";

                  results.push({
                    email: emails[0],
                    container: realPost,
                    text,
                  });
                }
                break;
              }

              parent = parent.parentElement;
              depth++;
            }
          }

          console.log(
            `[LinkedIn-AI][Content] Found ${results.length} post(s) with email`
          );

          return results;
        }

        function injectButton({ email, container, text }) {
          if (container.querySelector(".ai-apply-btn")) return;

          console.log(
            `[LinkedIn-AI][Content] Injecting Apply button for ${email}`
          );

          const btn = document.createElement("button");
          btn.className = "ai-apply-btn";
          btn.innerText = "Apply (AI) 🚀";

          btn.style.cssText = `
            width: calc(100% - 16px);
            margin: 8px;
            padding: 10px 16px;
            background-color: #0a66c2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            display: block;
          `;

          btn.style.transition =
            "background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease, box-shadow 0.2s ease";

          btn.onmouseenter = () => {
            btn.style.backgroundColor = "#0059b3";
            btn.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
          };

          btn.onmouseleave = () => {
            btn.style.backgroundColor = "#0a66c2";
            btn.style.boxShadow = "none";
          };

          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            chrome.runtime.sendMessage({
              type: "SET_PANEL_DATA",
              payload: { email, postText: text },
            });

            chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
          };

          // 🔒 SEARCH-safe placement (unchanged)
          const actionBar = container.querySelector(
            '[aria-label*="Like"], .feed-shared-social-action-bar'
          );

          if (actionBar && actionBar.parentElement) {
            actionBar.parentElement.appendChild(btn);
          } else {
            container.appendChild(btn);
          }
        }

        function scan() {
          findEmailsInPage().forEach(injectButton);
        }

        scan();
        setInterval(scan, 3000);
      },
    });

    injectedTabs.add(tabId);
  } catch (err) {
    console.error(`${LOG_PREFIX} Injection failed`, err);
  }
}

// ==============================
// Auto inject
// ==============================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("linkedin.com")
  ) {
    injectLinkedInScript(tabId);
  }
});

// ==============================
// Message handlers (UNCHANGED)
// ==============================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_PANEL" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  if (msg.type === "SET_PANEL_DATA") {
    chrome.storage.local.set({
      recruiterEmail: msg.payload.email || "",
      postText: msg.payload.postText || "",
    });
  }

  if (msg.type === "GENERATE_WITH_GEMINI") {
    const MODEL = msg.model || "gemini-3-flash-preview";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${msg.apiKey}`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg.prompt }] }],
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        sendResponse({
          success: res.ok,
          text: data.candidates?.[0]?.content?.parts?.[0]?.text,
          error: data.error?.message,
        });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});
