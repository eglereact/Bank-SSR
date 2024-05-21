import "bootstrap";

function hideAlertDiv() {
  let alertDiv = document.querySelector(".--alert");

  if (alertDiv) {
    setTimeout(function () {
      alertDiv.style.display = "none";
    }, 5000);
  }
}

hideAlertDiv();
