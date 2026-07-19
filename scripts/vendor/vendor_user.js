const query = new URLSearchParams(window.location.search);
const mockPreference = query.get("mock");
const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const mockMode = mockPreference === "true" || (mockPreference !== "false" && isLiveServerPreview);

if (!mockMode) {
  import("../js-login/user.js").catch((error) => {
    console.error("Unable to load the live vendor profile:", error);
  });
} else {
  const profile = {
    username: "bensvendor",
    description: "Second-generation hawker serving Hainanese chicken rice since 1998.",
    email: "ben.tan@hawkers-demo.sg",
    address: {
      line1: "1 Kadayanallur Street",
      city: "Singapore",
      postalCode: "069184",
    },
    receiveMethod: {
      type: "Bank Transfer",
      accountLast4: "4821",
    },
  };

  const fields = {
    username: document.getElementById("profileUsername"),
    description: document.getElementById("profileDescription"),
    email: document.getElementById("profileEmail"),
    address: document.getElementById("profileAddress"),
  };

  const editor = document.getElementById("editor");
  const editInput = document.getElementById("editInput");
  const addressFields = document.getElementById("addressFields");
  const receiveMethodEdit = document.getElementById("receiveMethodEdit");
  let currentEdit = null;

  function formatAddress() {
    return `${profile.address.line1}, ${profile.address.city} ${profile.address.postalCode}`;
  }

  function formatReceiveMethod() {
    return profile.receiveMethod.type === "Bank Transfer"
      ? `Bank Transfer •••• ${profile.receiveMethod.accountLast4}`
      : profile.receiveMethod.type;
  }

  function renderProfile() {
    fields.username.textContent = profile.username;
    fields.description.textContent = profile.description;
    fields.email.textContent = profile.email;
    fields.address.textContent = formatAddress();
    document.getElementById("profileReceiveMethod").textContent = formatReceiveMethod();
  }

  function closeEditors() {
    editor.style.display = "none";
    addressFields.style.display = "none";
    receiveMethodEdit.style.display = "none";
  }

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.edit;

      if (currentEdit === field && editor.style.display === "block") {
        closeEditors();
        return;
      }

      closeEditors();
      currentEdit = field;
      editor.style.display = "block";
      editInput.style.display = field === "address" ? "none" : "block";
      addressFields.style.display = field === "address" ? "block" : "none";

      if (field === "address") {
        document.getElementById("addrLine").value = profile.address.line1;
        document.getElementById("addrCity").value = profile.address.city;
        document.getElementById("addrPostal").value = profile.address.postalCode;
      } else {
        editInput.value = profile[field];
      }
    });
  });

  document.getElementById("saveEditBtn").addEventListener("click", () => {
    if (currentEdit === "address") {
      profile.address = {
        line1: document.getElementById("addrLine").value.trim(),
        city: document.getElementById("addrCity").value.trim(),
        postalCode: document.getElementById("addrPostal").value.trim(),
      };
    } else if (currentEdit && Object.hasOwn(profile, currentEdit)) {
      profile[currentEdit] = editInput.value.trim();
    }

    renderProfile();
    closeEditors();
  });

  document.getElementById("editReceiveMethodBtn").addEventListener("click", () => {
    const shouldOpen = receiveMethodEdit.style.display !== "block";
    closeEditors();
    receiveMethodEdit.style.display = shouldOpen ? "block" : "none";
    document.getElementById("receiveMethodType").value = profile.receiveMethod.type;
    document.getElementById("bankAccountNumber").value = profile.receiveMethod.accountLast4;
  });

  document.getElementById("saveReceiveMethodBtn").addEventListener("click", () => {
    const type = document.getElementById("receiveMethodType").value;
    const accountLast4 = document.getElementById("bankAccountNumber").value.trim();

    if (!type || (type === "Bank Transfer" && accountLast4.length !== 4)) {
      alert("Choose a receive method and enter four account digits when required.");
      return;
    }

    profile.receiveMethod = { type, accountLast4 };
    renderProfile();
    closeEditors();
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    alert("Logout is disabled in the presentation demo.");
  });

  renderProfile();
}
