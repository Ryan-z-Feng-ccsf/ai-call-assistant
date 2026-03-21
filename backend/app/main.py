import asyncio
import json
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from services.llm_service import process_audio_transcript
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

from database import engine, Base, SessionLocal
from models import CallRecord
from sqlalchemy import select

load_dotenv()

app = FastAPI()


# Map display language names → Deepgram language codes
DEEPGRAM_LANG_CODES: dict[str, str] = {
    "English": "en-US",
    "Chinese (中文)": "zh-CN",
    "Spanish (Español)": "es",
    "French (Français)": "fr",
    "Japanese (日本語)": "ja",
    "Korean (한국어)": "ko",
    "Portuguese (Português)": "pt",
    "Arabic (العربية)": "ar",
    "Hindi (हिन्दी)": "hi",
    "German (Deutsch)": "de",
    "Vietnamese (Tiếng Việt)": "vi",
    "Italian (Italiano)": "it",
    "Russian (Русский)": "ru",
    "Dutch (Nederlands)": "nl",
}


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("🗄️ Database tables created/verified.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/history")
async def get_call_history():
    async with SessionLocal() as db:
        result = await db.execute(
            select(CallRecord).order_by(CallRecord.created_at.desc())
        )
        records = result.scalars().all()
        return [
            {
                "id": r.id,
                "scenario": r.scenario,
                "source_language": r.source_language,
                "target_language": r.target_language,
                "transcript": r.transcript,
                "summary": r.summary,
                "translation": r.translation,
                "replies": r.get_replies_list(),
                "date": r.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for r in records
        ]


@app.delete("/history/{record_id}")
async def delete_call_record(record_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(CallRecord).filter(CallRecord.id == record_id))
        record = result.scalar_one_or_none()
        if record is None:
            raise HTTPException(status_code=404, detail="Record not found")
        await db.delete(record)
        await db.commit()
        return {"message": "Record deleted successfully"}


@app.websocket("/ws/audio")
async def audio_stream_endpoint(
    websocket: WebSocket,
    scenario: str = "General Professional Call",
    source_language: str = "English",  # language being spoken
    target_language: str = "Chinese (中文)",  # language to translate into
):
    await websocket.accept()
    print(
        f"🟢 Connected | Scenario: {scenario} | {source_language} → {target_language}"
    )

    # Look up the Deepgram language code for the source language
    dg_lang = DEEPGRAM_LANG_CODES.get(source_language, "en-US")

    transcript_buffer = ""

    try:
        dg_connection = deepgram.listen.asyncwebsocket.v("1")

        async def on_message(self, result, **kwargs):
            nonlocal transcript_buffer
            sentence = result.channel.alternatives[0].transcript
            if not sentence:
                return

            if result.is_final:
                print(f"🎤 Heard ({source_language}): {sentence}")
                await websocket.send_text(json.dumps({"transcript": sentence}))
                transcript_buffer += sentence + " "

                if len(transcript_buffer.strip()) > 15:
                    print(
                        f"🧠 Sending to Gemini: {source_language} → {target_language}"
                    )
                    ml_response = await process_audio_transcript(
                        transcript_buffer.strip(),
                        scenario,
                        source_language,
                        target_language,
                    )

                    async with SessionLocal() as db:
                        new_record = CallRecord(
                            scenario=scenario,
                            source_language=source_language,
                            target_language=target_language,
                            transcript=transcript_buffer.strip(),
                            summary=ml_response.get("summary", ""),
                            translation=ml_response.get("translation", ""),
                            replies_json=json.dumps(ml_response.get("replies", [])),
                        )
                        db.add(new_record)
                        await db.commit()
                        print("💾 Record saved.")

                    ml_response.pop("transcript", None)
                    await websocket.send_text(json.dumps(ml_response))
                    print("📡 Sent ML package to frontend.")
                    transcript_buffer = ""

        async def on_error(self, error, **kwargs):
            print(f"⚠️ Deepgram Error: {error}")

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

        options = LiveOptions(
            model="nova-3",
            language=dg_lang,  # dynamically set based on source language
            smart_format=True,
        )

        if not await dg_connection.start(options):
            print("🔴 Failed to connect to Deepgram.")
            return

        print(f"🟢 Deepgram listening in '{dg_lang}'...")

        while True:
            data = await websocket.receive_bytes()
            await dg_connection.send(data)

    except WebSocketDisconnect:
        print("🔴 Client disconnected.")
    except Exception as e:
        print(f"⚠️ Unexpected error: {e}")
    finally:
        if "dg_connection" in locals():
            await dg_connection.finish()
            print("🛑 Deepgram connection closed.")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
