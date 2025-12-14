console.log("===== LinkedIn AI Apply Extension STEP 5 LOADED =====");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Helper: extract emails from a given element
function extractEmailsFromElement(element) {
  const emails = new Set();

  // Text content
  const text = element.innerText || "";
  (text.match(emailRegex) || []).forEach(e => emails.add(e));

  // mailto links
  element.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    const email = link.href.replace("mailto:", "").split("?")[0];
    if (email) emails.add(email);
  });

  return Array.from(emails);
}

// Detect posts and log emails per post
function processPosts() {
  const posts = document.querySelectorAll('div[data-urn]');

  console.log("Posts detected:", posts.length);

  posts.forEach((post, index) => {
    const emails = extractEmailsFromElement(post);

    if (emails.length > 0) {
      console.log(`Post ${index + 1} → Emails found:`);
      emails.forEach((email, i) => {
        console.log(`  ${i + 1}. ${email}`);
      });
    }
  });
}

// Run once
processPosts();

// Re-run when LinkedIn loads new posts
const observer = new MutationObserver(() => {
  processPosts();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
