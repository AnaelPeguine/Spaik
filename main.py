from fastapi import FastAPI, UploadFile, File,Request
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
async def translate_audio(request: Request):
    data = await request.json()
    text = data.get('content') # default to 'whisper-1' if no language is provided
    scenario = data.get('scenario')
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an AI capable of enhancing the language level of texts while maintaining the original language."},
            {"role": "user", "content": f"Can you assist in refining this text: {text} ,without adding any additional content? It's important that the text stays in the same language and fits a {scenario} scenario."}]
    )

    content = response['choices'][0]['message']['content']

    return {content}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8005)