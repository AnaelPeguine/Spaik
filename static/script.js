
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
  console.log('push')
  console.log(ev.data)
  improvedTextElement.classList.remove('visible'); // hide the element

}

function stopRecording(ev) {
  console.log(dataArray.length);

  let audioData = new Blob(dataArray, { type: "audio/mp3" });

  dataArray = [];
  let formData = new FormData();
  formData.append('audio', audioData, 'audio2.mp3');

  uploadAudio(formData)
    .then(data => translateAudio(formData))
    .then(data => improveText(data))
    .catch(error => console.error('Error:', error));
}

function uploadAudio(formData) {
  return fetch('/uploadaudio/', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}

function translateAudio(formData) {
  return fetch('/translateaudio/', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}

function improveText(success) {
  console.log(success);
  console.log(document.getElementById('selected-value').innerText);

  fetch('/improver/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "content": success, "scenario":document.getElementById('selected-value').innerText })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    improvedTextElement.textContent = "";  // Clear the content

    // split text into sentences
    let sentences = data[0].match(/[^\.!\?]+[\.!\?]+/g);
  
    let voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('girl'));
  
    // if voices aren't loaded yet
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = function () {
        voices = window.speechSynthesis.getVoices();
        selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('girl'));
        processVoices(sentences, selectedVoice);
      }
    } else {
      processVoices(sentences, selectedVoice);
    }
  
    function processVoices(sentences, selectedVoice) {
      if (!selectedVoice) {
        console.log('No female voice found');
        return;
      }
      // create and speak utterances
      let utterance;
      let index = 0;
  
      function speakNextUtterance() {
        if (index < sentences.length) {
            utterance = new SpeechSynthesisUtterance(sentences[index]);
            utterance.voice = selectedVoice;
    
            window.speechSynthesis.speak(utterance);
    
            if (index == 0) {
                improvedTextElement.classList.add('visible'); // make it visible at the start of the first sentence
            }
    
            typewriterEffect(improvedTextElement, sentences[index], 70) // apply typewriter effect
                .then(() => {
                    index++;
                    speakNextUtterance(); // call the next utterance recursively
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }
    
  
      speakNextUtterance();
    }
  
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  const optionsViewButton = document.getElementById('options-view-button');

  radioButtons.forEach(function(radioButton) {
    radioButton.onclick = function() {
      const labelElement = radioButton.nextElementSibling.nextElementSibling.nextElementSibling
      document.getElementById('selected-value').innerText = labelElement.innerText;
      optionsViewButton.checked = false; // Close the options view
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





