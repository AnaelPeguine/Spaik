// let audioIN = { audio: true };
// let mediaStreamObj;
// let mediaRecorder;
// let dataArray = [];


// // Access the permission for use
// // the microphone
// navigator.mediaDevices.getUserMedia(audioIN)
//   .then(function (stream) {
//     // Assign the media stream to a variable
//     mediaStreamObj = stream;

//     // Start/Stop button
//     let toggleButton = document.getElementById('btnToggle');
//     let isRecording = false;

//     // This is the main thing to record
//     // the audio 'MediaRecorder' API
//     let options = {audioBitsPerSecond : 128000}  // 128kbps
//     mediaRecorder = new MediaRecorder(mediaStreamObj, options);
//     // Pass the audio stream

//     toggleButton.addEventListener('click', function (ev) {

//       if (isRecording) {
//         // Stop recording
//         mediaRecorder.stop();
//         isRecording = false;

//       } else {
//         // Start recording
//         mediaRecorder.start();
//         console.log('Recording');
//         isRecording = true;

//       }
//     });

//     // If audio data is available, push
//     // it to the dataArray
//     mediaRecorder.ondataavailable = function (ev) {
//       dataArray.push(ev.data);
//       console.log('push')
//       console.log(ev.data)

//     };

//     // Convert the audio data into a blob
//     // after stopping the recording
//     mediaRecorder.onstop = function (ev) {
//       console.log(dataArray.length); // Check the captured audio data

//       let audioData = new Blob(dataArray, { type: "audio/mp3" });
//       // ; codecs=opus" });

//       // After filling up the dataArray
//       // make it empty
//       dataArray = [];
//       let formData = new FormData();
//       formData.append('audio', audioData, 'audio2.mp3'); // Change 'audio.wav' to the desired filename
//       console.log(formData.length); // Check the captured audio data
//       // Upload the audio file
//       fetch('/uploadaudio/', {
//         method: 'POST',
//         body: formData
//       })
//       .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//       })
//       .then(success => {
//         console.log(success);
//         fetch('/translateaudio/', {
//         method: 'POST',
//         body: formData
//       })
//       .then(response => {
//           if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//           }
//           return response.json();
//         })
//          .then(success => {
//           console.log(success);
//           fetch('http://localhost:8005/improver/', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({"content": success})
//           })
//           .then(response => {
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
//             return response.json();
//           })
//           .then(data => {
//             console.log(data[0]); 

//             let improvedTextElement = document.getElementById('improvedText');

//             // add text to the element
//             improvedTextElement.innerText = data[0];

//             // if there's text inside, add the 'visible' class
//             if (improvedTextElement.textContent.trim() !== '') {
//               improvedTextElement.classList.add('visible');
//             }
//             // This will ensure that the voices are loaded before you try to use them
//             window.speechSynthesis.onvoiceschanged = function() {
//               let voices = window.speechSynthesis.getVoices();
              
//               // Try to find a female voice
//               let selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('girl'));
              
//               if (!selectedVoice) {
//                   console.log('No female voice found');
//                   return;
//               }
          
//               let utterance = new SpeechSynthesisUtterance(data[0]);
              
//               // Set the voice
//               utterance.voice = selectedVoice;
//               console.log(utterance)
//               // Speak the text
//               window.speechSynthesis.speak(utterance);
//           };
          
//           })
//           .catch(error => {
//             console.error('Error:', error);
//           });
         
      
//         })
//         .catch(error => {
//           console.error('Error:', error);
//         });
//       })
//       .catch(error => {
//         console.error('Error:', error);
//       });
      
//     };
    
//     // Set the media stream as the source for an audio element
//     let audioElement = document.querySelector('audio');
//     audioElement.srcObject = mediaStreamObj;
//   })
//   // If any error occurs, handle the error
//   .catch(function (err) {
//     console.log(err.name, err.message);
//   });
let audioIN = { audio: true };
let mediaStreamObj;
let mediaRecorder;
let dataArray = [];

navigator.mediaDevices.getUserMedia(audioIN)
  .then(function (stream) {
    mediaStreamObj = stream;

    let toggleButton = document.getElementById('btnToggle');
    let isRecording = false;

    let options = { audioBitsPerSecond: 128000 }
    mediaRecorder = new MediaRecorder(mediaStreamObj, options);

    toggleButton.addEventListener('click', function (ev) {
      if (isRecording) {
        mediaRecorder.stop();
        isRecording = false;
      } else {
        mediaRecorder.start();
        console.log('Recording');
        isRecording = true;
      }
    });

    mediaRecorder.ondataavailable = function (ev) {
      dataArray.push(ev.data);
      console.log('push')
      console.log(ev.data)
    };

    mediaRecorder.onstop = function (ev) {
      console.log(dataArray.length);

      let audioData = new Blob(dataArray, { type: "audio/mp3" });

      dataArray = [];
      let formData = new FormData();
      formData.append('audio', audioData, 'audio2.mp3');

      fetch('/uploadaudio/', {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(success => {
          console.log(success);

          fetch('/translateaudio/', {
            method: 'POST',
            body: formData
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(success => {
              console.log(success);

              fetch('http://localhost:8005/improver/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "content": success })
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  return response.json();
                })
                .then(data => {
                  console.log(data[0]);

                  let improvedTextElement = document.getElementById('improvedText');

                  // split text into sentences
                  let sentences = data[0].match(/[^\.!\?]+[\.!\?]+/g);
                  console.log(sentences)
                  window.speechSynthesis.onvoiceschanged = function () {
                    let voices = window.speechSynthesis.getVoices();
                    let selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('girl'));

                    if (!selectedVoice) {
                      console.log('No female voice found');
                      return;
                    }

                    // create and speak utterances
                    let utterance;
                    let index = 0;

                    function speakNextUtterance() {
                      if (index < sentences.length) {
                        console.log("utterance")

                        utterance = new SpeechSynthesisUtterance(sentences[index]);
                        utterance.voice = selectedVoice;
                        window.speechSynthesis.speak(utterance);
                        improvedTextElement.classList.add('visible');
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
                  };
                })
                .catch(error => {
                  console.error('Error:', error);
                });
            })
            .catch(error => {
              console.error('Error:', error);
            });
        })
        .catch(error => {
          console.error('Error:', error);
        });
    };

    let audioElement = document.querySelector('audio');
    audioElement.srcObject = mediaStreamObj;
  })
  .catch(function (err) {
    console.log(err.name, err.message);
  });

// Typewriter effect
function typewriterEffect(elem, text, delay) {
  console.log("typewriterEffect")
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
