from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tts")
def tts_endpoint(text: str = Query(..., min_length=1)):
    # Generate MP3 in memory
    mp3_fp = io.BytesIO()
    tts = gTTS(text)
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    return StreamingResponse(
        mp3_fp,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=output.mp3",
            "Cross-Origin-Resource-Policy": "cross-origin"
        }
    )
