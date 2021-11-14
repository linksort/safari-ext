const message = document.getElementById("message");
const clearButton = document.getElementById("clear");
const authenticateButton = document.getElementById("authenticate");

const BASE_URI = `https://linksort.com`;
const NULL = "NULL";

function showLogin() {
  message.innerText = "Please sign in to save your links to Linksort.";
  clearButton.style.display = "none";
  authenticateButton.style.display = "inline-block";
}

function showLogout() {
  message.innerHTML =
    "You are now signed into your Linksort browser extension. <br /><br />Close this window and use the Linksort icon in your browser's toolbar to save links as you browse.";
  clearButton.style.display = "inline-block";
  authenticateButton.style.display = "none";
}

function doAuth() {
  const redirectURL = `${BASE_URI}/`;
  const encodedRedirectURL = encodeURIComponent(redirectURL);
  const authURL = `${BASE_URI}/oauth?redirect_uri=${encodedRedirectURL}`;

  return launchWebAuthFlow(
    {
      interactive: true,
      url: authURL,
    },
    (redirect) => {
      const parsed = new URL(redirect);
      const encodedToken = parsed.searchParams.get("token");
      const token = decodeURIComponent(encodedToken);
      chrome.storage.local.set({ token }, () => {
        showLogout();
      });
    }
  );
}

function launchWebAuthFlow({ url }, callback) {
  chrome.tabs.create(
    {
      url,
    },
    (wInfo) => {
      const windowId = wInfo.id;

      function handleRedirect(details) {
        if (details.url && details.url.includes("?token=")) {
          callback(details.url);
          chrome.tabs.remove(windowId);
        }
      }

      chrome.webNavigation.onCommitted.addListener(handleRedirect, {
        url: [{ hostEquals: "linksort.com" }],
      });
    }
  );
}

chrome.storage.local.get(["token"], (values) => {
  if (values.token && values.token !== NULL) {
    showLogout();
  } else {
    showLogin();
    doAuth();
  }
});

clearButton.addEventListener("click", () => {
  chrome.storage.local.set({ token: NULL }, () => {
    showLogin();
  });
});

authenticateButton.addEventListener("click", doAuth);
