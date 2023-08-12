
let audioIN = { audio: true };
let mediaStreamObj;
let mediaRecorder;
let dataArray = [];
let isRecording = false;
let toggleButton = document.getElementById('btnToggle');
let icon = document.getElementById('icon');
let improvedTextElement = document.getElementById('improvedText');

navigator.mediaDevices.getUserMedia(audioIN)
.then(function (stream) {

  mediaStreamObj = stream;
  let options = { audioBitsPerSecond: 128000 }
  mediaRecorder = new MediaRecorder(mediaStreamObj, options);

  toggleButton.addEventListener('click', function (ev) {

    if (isRecording) {
      
      mediaRecorder.stop();
      isRecording = false;
      icon.className = "fas fa-microphone";

    } else {

      isRecording = true;
      mediaRecorder.start();
      console.log('Recording');
      icon.className = "far fa-stop-circle";

    }

  });

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = stopRecording;
  let audioElement = document.querySelector('audio');
  audioElement.srcObject = mediaStreamObj;

})
.catch(function (err) {
  console.log(err.name, err.message);
});

function handleDataAvailable(ev) {

  dataArray.push(ev.data);
  improvedTextElement.classList.remove('visible');

}

function stopRecording(ev) {
  showLoader(); // Display the loader immediately after the recording stops
  console.log("show loader")
  const audioDataBlob = new Blob(dataArray, { type: "audio/mp3" });
  dataArray = [];
  const formData = new FormData();
  formData.append('audio', audioDataBlob, 'audio2.mp3');

  uploadAudio(formData)
      .then(uploadResponse => translateAudio(formData))
      .then(translationResponse => improveText(translationResponse))
      .catch(error => {
          hideLoader(); // Ensure the loader is hidden in case of any errors
          console.error('Error:', error.message);
      });
}

function makeApiRequest(url, formData) {
  return fetch(url, {
      method: 'POST',
      body: formData
  })
  .then(response => {

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      }

      console.log(`apirequest`);

      return response.json();

  });
}

function uploadAudio(formData) {

  console.log(`Uploading audio`);

  return makeApiRequest('/uploadaudio/', formData);

}

function translateAudio(formData) {
  return makeApiRequest('/translateaudio/', formData);
}

function saveImprovedTextToDB(improvedText) {
  const username = window.loggedInUsername;  // Get this dynamically based on who's logged in

  fetch('/save-improved-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        "username": username,
        "text_data": improvedText
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      console.log(data.message);
  })
  .catch(error => {
      console.error('Error saving improved text:', error);
  });
}

function saveImprovedTextToDB(improvedText, text) {
  const username = window.loggedInUsername;  

  fetch('/save-improved-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        "username": username,
        "improvedText": improvedText,
        "text": text

      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      console.log(data.message);
  })
  .catch(error => {
      console.error('Error saving improved text:', error);
  });
}

function improveText(success) {

  console.log(success);
  const improvedTextElement = document.querySelector("#improvedText"); 

  fetch('/improver/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      "content": success, 
      "scenario": document.getElementById('selected-value').innerText 
    })
  })
  .then(response => {

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();

  })
  .then(data => {

    improvedTextElement.textContent = "";
    if (window.isLoggedIn) {
      saveImprovedTextToDB(data[0], success);  
    }
    const sentences = data[0].match(/[^\.!\?]+[\.!\?]+/g);
    speakSentences(sentences);
    hideLoader(); // Hide the loader before invoking the speakSentences function


  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function showLoader() {

  const iconElement = document.getElementById('icon');
  iconElement.className = 'fas fa-spinner fa-spin';

}

function hideLoader() {

  const iconElement = document.getElementById('icon');
  iconElement.className = 'fas fa-microphone';

}

function getFemaleVoice() {

  const voices = window.speechSynthesis.getVoices();
  const femaleIdentifiers = ['female', 'woman', 'girl'];

  return voices.find(voice => femaleIdentifiers.some(id => voice.name.toLowerCase().includes(id)));

}

function speakSentences(sentences) {

  const improvedTextElement = document.querySelector("#improvedText"); 
  let selectedVoice = getFemaleVoice();

  if (!selectedVoice) {

    if (!window.speechSynthesis.onvoiceschanged) {

      window.speechSynthesis.onvoiceschanged = function () {

        selectedVoice = getFemaleVoice();
        processVoices(sentences, selectedVoice);

      }

    }

  } else {
    processVoices(sentences, selectedVoice);
  }

}

function processVoices(sentences, selectedVoice) {

  if (!selectedVoice) {

    console.log('No female voice found');
    return;

  }

  let utterance;
  let index = 0;
  const improvedTextElement = document.querySelector("#improvedText"); 

  function speakNextUtterance() {

    if (index < sentences.length) {

      utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.voice = selectedVoice;
      window.speechSynthesis.speak(utterance);

      if (index == 0) {
        improvedTextElement.classList.add('visible');
      }

      typewriterEffect(improvedTextElement, sentences[index], 70)
        .then(() => {
          index++;
          speakNextUtterance();
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }

  }
  
  speakNextUtterance();
}


document.addEventListener('DOMContentLoaded', (event) => {

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  const optionsViewButton = document.getElementById('options-view-button');

  radioButtons.forEach(function(radioButton) {

    radioButton.onclick = function() {
      const labelElement = radioButton.nextElementSibling.nextElementSibling.nextElementSibling
      document.getElementById('selected-value').innerText = labelElement.innerText;
      optionsViewButton.checked = false; 
    }

  });

});


// Typewriter effect
function typewriterEffect(elem, text, delay) {

let i = 0;

return new Promise((resolve, reject) => {
  
  let interval = setInterval(function () {

    if (i < text.length) {

      elem.textContent += text.charAt(i);
      i++;

    } else {

      clearInterval(interval);
      resolve();

    }

  }, delay);

});

}





