from fastapi import FastAPI, UploadFile, File,HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import shutil
import json
import openai
from pydantic import BaseModel
from pydub import AudioSegment

from config import API_KEY
openai.api_key = API_KEY


app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

class Text(BaseModel):
    content: str

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("templates/index.html") as f:
        return f.read()

@app.post("/uploadaudio/")
async def upload_audio(audio: UploadFile = File(...)):
    with open(f"audio_files/{audio.filename}", 'wb') as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    return {"info": f"file '{audio.filename}' stored at audio_files/{audio.filename}", "audio_url": f"audio_files/{audio.filename}"}

@app.post("/translateaudio/")
async def translate_audio():
    x = open("audio_files/audio2.mp3",'rb')
    transcript = openai.Audio.transcribe("whisper-1",x) # worked
    transcript_text = transcript['text'] # change this line as needed
    with open('text_to_improve/text.txt', 'w') as f:
        f.write(transcript_text)
    return transcript_text

@app.post("/improver/")
async def improve_english_level(text: Text):  # Include text parameter
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            # {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Improve the English level of the text and make it suitable for a presentation in front of an audience: {text.content}"},
        ]
    )

    content = response['choices'][0]['message']['content']

    return {content}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8005)