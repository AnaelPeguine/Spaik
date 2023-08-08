// Get the modal
var modal = document.getElementById('logInModal');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

const loginForm = document.querySelector("#login-form"); // If login-form is an id

loginForm.addEventListener('submit', submitLogInForm);

async function submitLogInForm(event) {
  event.preventDefault();

  const formData = new URLSearchParams(new FormData(event.target));

  const response = await fetch('/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Logged in:', data);
    document.getElementById('logInButton').innerHTML = `<a href="#user">${data.username}</a>`;
    signInButton.style.display = "none";
    modal.style.display = "none";

    // Other code to update the button and close the modal
  } else {
    // Handle failure, e.g., display an error message
    console.log("error");
  }
}
