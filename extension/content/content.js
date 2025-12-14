console.log("===== LinkedIn AI Apply Extension LOADED =====");

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

let lastEmails = [];

function extractEmails() {
  const emailsSet = new Set();

  // 1. From visible text
  const pageText = document.body.innerText || "";
  (pageText.match(emailRegex) || []).forEach(e => emailsSet.add(e));

  // 2. From mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    const email = link.href.replace("mailto:", "").split("?")[0];
    if (email) emailsSet.add(email);
  });

  const emails = Array.from(emailsSet);

  // Log ONLY if something changed (avoid spam)
  if (JSON.stringify(emails) !== JSON.stringify(lastEmails)) {
    console.log("===== LinkedIn AI Apply Extension UPDATE =====");
    console.log("Emails found count:", emails.length);

    if (emails.length > 0) {
      emails.forEach((email, i) => {
        console.log(`${i + 1}. ${email}`);
      });
    } else {
      console.log("No email addresses found yet.");
    }

    lastEmails = emails;
  }
}

// Run once initially
extractEmails();

// Observe DOM changes (LinkedIn loads content dynamically)
const observer = new MutationObserver(() => {
  extractEmails();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
