var signInModal = document.getElementById('signInModal');
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == signInModal) {
      signInModal.style.display = "none";
    }
}
async function submitForm(event) {
    event.preventDefault();
    const formData = {
      username: document.getElementById('usernameSignIn').value,
      password: document.getElementById('passwordSignIn').value
    };
    const response = await fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    const result = await response.json();
    const passwordError = document.getElementById('passwordErrorSignIn');

    if (result.error) {
      passwordError.textContent = result.error;
      console.log(result.error)

    } else {
        // Update the button text to the user's username
        document.getElementById('signInButton').innerHTML = `<a href="#user">${formData.username}</a>`;
        // Remove the onclick attribute to make it unclickable
        signInButton.removeAttribute('onclick');
        // Change the cursor style to "default"
        signInButton.style.cursor = 'default';
        // Remove any hover effect by setting the styles directly
        signInButton.style.backgroundColor = 'inherit'; // Replace with the actual normal background color if needed
        signInButton.style.color = 'inherit'; // Replace with the actual normal text color if needed
        // Disable pointer events (including hover)
        signInButton.style.pointerEvents = 'none';
        logInButton.style.display = "none";
        signInModal.style.display = "none";
    }

} 