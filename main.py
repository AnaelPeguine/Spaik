
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
        
    return {
        "info": f"file '{audio.filename}' stored at audio_files/{audio.filename}",
          "audio_url": f"audio_files/{audio.filename}"
    }

@app.post("/translateaudio/")
async def translate_audio():

    x = open("audio_files/audio2.mp3",'rb')
    transcript = openai.Audio.transcribe("whisper-1",x) 
    transcript_text = transcript['text'] 

    with open('text_to_improve/text.txt', 'w') as f:
        f.write(transcript_text)

    return transcript_text

@app.post("/improver/")
async def translate_audio(request: Request):

    data = await request.json()
    text = data.get('content') 
    scenario = data.get('scenario')

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages= [
            {
                "role": "system",
                "content": "You are an AI capable of enhancing the language level of texts while maintaining the original language.Your response should start directly with the revised text, with no preamble or introduction."
            },
            {
                "role": "user",
                "content": f"an you assist in refining this text: {text} ,without adding any additional content? Make the revised text fit a {scenario} scenario."
            }
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
    
    return True 

def create_user(db, username: str, password: str):
    cursor = db.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, get_password_hash(password)))
        db.commit()
    except sqlite3.IntegrityError:
        raise ValueError("Username already exists.")
    finally:
        cursor.close()

    
def validate_password(password: str) -> bool:

    min_length = 8

    if len(password) < min_length or not re.search(r'\d', password):
        return False
    
    return True

@app.post("/token")
async def login(request: Request):
    data = await request.json()
    username = data.get('username') 
    password = data.get('password')
    with sqlite3.connect("spaikDB.db") as conn:
        try:
            user = authenticate_user(conn,username, password)

            if not user:
                return {"error": "Invalid UserName or Password"}
            
            return {"access_token": user[2], "token_type": "bearer", "username": user[0]}  
        
        except Exception as e:

            print(f"Exception occurred: {str(e)}") 
            raise HTTPException(status_code=500, detail=str(e)) 
   


@app.post("/signup")
async def sign_up(request: Request):

    data = await request.json()
    username = data.get('username') 
    password = data.get('password')

    if not validate_password(password):

        return {"error": "Password must be at least 8 characters long and include at least one digit."}
    
    with sqlite3.connect("spaikDB.db") as conn:
        try:
            create_user(conn, username, password)
        except ValueError as e:
            return {"error": "Username already exists"}
    return {"message": "User created successfully"}

@app.post("/save-improved-text")
async def save_improved_text(request: Request):
    data = await request.json()
    username = data.get('username')  # assuming you'll send the username
    improvedText = data.get('improvedText')
    text = data.get('text')
    with sqlite3.connect("spaikDB.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO user_texts (username, text_data, improved_Text) VALUES (?, ?, ?)", (username, text, improvedText))
        conn.commit()
    
    return {"message": "Text saved successfully"}

@app.post("/get-history")
async def get_history(request: Request):
    data = await request.json()
    username = data.get('username')
    print(f"Received username: {username}")


    with sqlite3.connect("spaikDB.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT text_data, improved_Text FROM user_texts WHERE username = ?", (username,))
        data = cursor.fetchall()

    return {"history": data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8010)

