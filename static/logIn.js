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

  const formData = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  };
  const response = await fetch('/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  const passwordError = document.getElementById('passwordError');
  
  if (result.error) {
    passwordError.textContent = result.error;
    console.log(result.error)
  }else {
    document.getElementById('signInButton').innerHTML = `<a href="#user">${formData.username}</a>`;
    modal.style.display = "none";
    window.isLoggedIn = true;
    logInButton.innerHTML = `<a href="/static/history.html">History</a>`;

    window.loggedInUsername = formData.username;
    localStorage.setItem('loggedInUsername', formData.username);
  }
}
