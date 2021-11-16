const main = document.querySelector("main");

const BASE_URI = `https://linksort.com`;

function renderError(error) {
  main.innerHTML = `<div class="error"><img src="hushed-face.svg"><h1>Uh oh!</h1><p>${error}</p></div>`;
}

function renderSuccess() {
  main.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#1b1f23" /></svg>';
}

function openOptionsPage() {
  if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
}

chrome.storage.local.get(["token"], (store) => {
  if (!store.token || store.token === "NULL") {
    openOptionsPage();
    renderError("Please sign in.");
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab.url.startsWith("http")) {
      const split = tab.url.split(":");
      if (split.length > 0 && split[0].includes("extension")) {
        renderError(
          "You cannot save your extension's options page to Linksort"
        );
        return;
      }

      renderError("This cannot be saved to Linksort");
      return;
    }

    fetch(`${BASE_URI}/api/links`, {
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.token}`,
      }),
      method: "POST",
      mode: "cors",
      body: JSON.stringify({
        title: tab.title,
        url: tab.url,
        favicon:
          tab.favIconUrl && tab.favIconUrl.startsWith("https")
            ? tab.favIconUrl
            : "",
      }),
    })
      .then((response) => {
        response.json().then((body) => {
          switch (response.status) {
            case 201:
              renderSuccess();
              break;
            case 400:
              const message = body.url ? body.url : body.message;
              if (message === "This link has already been saved.") {
                renderSuccess();
              } else {
                renderError(message);
              }
              break;
            case 401:
            case 403:
              openOptionsPage();
              renderError("It looks like you'll have to sign in again.");
              break;
            default:
              renderError("Something went wrong.");
              break;
          }
        });
      })
      .catch(() => {
        renderError("Failure to launch.");
      });
  });
});
