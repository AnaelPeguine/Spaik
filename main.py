
from fastapi import FastAPI, UploadFile, File,Request,HTTPException, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse
import shutil
import json
import openai
from pydantic import BaseModel
from pydub import AudioSegment
import sqlite3
from passlib.context import CryptContext
from typing import Optional
import re

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
            {"role": "system", "content": "You are an AI capable of enhancing the language level of texts while maintaining the original language.Your response should start directly with the revised text, with no preamble or introduction."},
            {"role": "user", "content": f"an you assist in refining this text: {text} ,without adding any additional content? Make the revised text fit a {scenario} scenario."}
        ]
    )

    content = response['choices'][0]['message']['content']

    return {content}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, username: str):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    return user

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user[1]):
        return False
    return user

def create_user(db, username: str, password: str):
    cursor = db.cursor()
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, get_password_hash(password)))
    db.commit()
    
def validate_password(password: str) -> bool:
    min_length = 8
    if len(password) < min_length or not re.search(r'\d', password):
        return False
    return True

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with sqlite3.connect("spaikDB.db") as conn:
            user = authenticate_user(conn, form_data.username, form_data.password)
            if not user:
                raise HTTPException(status_code=401, detail="Incorrect username or password")
            return {"access_token": user[2], "token_type": "bearer", "username": user[0]}  
    except Exception as e:
        print(f"Exception occurred: {str(e)}")  # Log the exception
        raise HTTPException(status_code=500, detail=str(e))  # Provide the error detail to the client


@app.post("/signup")
async def sign_up(request: Request):
    data = await request.json()
    username = data.get('username') # default to 'whisper-1' if no language is provided
    password = data.get('password')
    # Validate the password
    if not validate_password(password):
        return {"error": "Password must be at least 8 characters long and include at least one digit."}
    with sqlite3.connect("spaikDB.db") as conn:
        create_user(conn, username, password)
    return {"message": "User created successfully"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8003)