import asyncio
import json
import os
import httpx
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Depends,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from dotenv import load_dotenv
import jwt

from services.llm_service import process_audio_transcript
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

from database import engine, Base, SessionLocal
from models import CallRecord
from sqlalchemy import select

load_dotenv()

app = FastAPI()

# ── Clerk JWT verification ──────────────────────────────────────
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

security = HTTPBearer()


async def get_clerk_public_keys():
    """Fetch Clerk's JWKS for JWT verification."""
    # Extract the Clerk domain from the publishable key
    # pk_test_xxx -> xxx.clerk.accounts.dev
    import base64

    try:
        raw = CLERK_PUBLISHABLE_KEY.split("_")[2]
        # Add padding
        padding = 4 - len(raw) % 4
        raw += "=" * padding
        domain = base64.b64decode(raw).decode().rstrip("$")
        jwks_url = f"https://{domain}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(jwks_url)
            return resp.json()
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return None


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify Clerk JWT and return user_id."""
    token = credentials.credentials
    try:
        # Decode without verification first to get the header
        header = jwt.get_unverified_header(token)

        # Fetch public keys
        jwks = await get_clerk_public_keys()
        if not jwks:
            raise HTTPException(status_code=401, detail="Could not fetch auth keys")

        # Find the matching key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == header.get("kid"):
                from jwt.algorithms import RSAAlgorithm

                public_key = RSAAlgorithm.from_jwk(json.dumps(key))
                break

        if not public_key:
            raise HTTPException(status_code=401, detail="Public key not found")

        # Verify and decode
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID in token")
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# ── Startup ─────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("🗄️ Database tables created/verified.")


# ── CORS ────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,https://ai-call-assistant-tau.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))


def get_endpointing_value(scenario: str) -> int:
    """Dynamically adjust Deepgram endpointing based on call scenario.

    Fast-paced scenarios (commands, quick instructions) use shorter endpointing
    to detect speech boundaries faster. Slow-paced scenarios (learning, practice)
    use longer endpointing to allow for natural pauses.
    """
    scenario_lower = scenario.lower()

    # Fast pace: quick instructions, commands
    if any(kw in scenario_lower for kw in ("command", "quick", "urgent", "fast")):
        return 500

    # Slow pace: language learning, deep thinking, practice
    if any(kw in scenario_lower for kw in ("learning", "practice", "education", "study")):
        return 1500

    # Default for general professional calls
    return 1000

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


# ── Health ──────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── History ─────────────────────────────────────────────────────
@app.get("/history")
async def get_call_history(user_id: str = Depends(verify_clerk_token)):
    async with SessionLocal() as db:
        result = await db.execute(
            select(CallRecord)
            .where(CallRecord.user_id == user_id)  # ← only this user's records
            .order_by(CallRecord.created_at.desc())
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
async def delete_call_record(
    record_id: int, user_id: str = Depends(verify_clerk_token)
):
    async with SessionLocal() as db:
        result = await db.execute(
            select(CallRecord).filter(
                CallRecord.id == record_id,
                CallRecord.user_id == user_id,  # ← can only delete own records
            )
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise HTTPException(status_code=404, detail="Record not found")
        await db.delete(record)
        await db.commit()
        return {"message": "Record deleted successfully"}


# ── Background Task: Save to DB ────────────────────────────────
async def save_record_bg(
    user_id: str,
    scenario: str,
    source_language: str,
    target_language: str,
    transcript: str,
    summary: str,
    translation: str,
    replies: list,
):
    """Background asynchronous task to save call record, not blocking the main WebSocket communication thread"""
    try:
        async with SessionLocal() as db:
            new_record = CallRecord(
                user_id=user_id,
                scenario=scenario,
                source_language=source_language,
                target_language=target_language,
                transcript=transcript,
                summary=summary,
                translation=translation,
                replies_json=json.dumps(replies),
            )
            db.add(new_record)
            await db.commit()
            print("💾 [Background] Record saved to PostgreSQL.")
    except Exception as e:
        print(f"⚠️ [Background] DB Save Error: {e}")


# ── WebSocket ────────────────────────────────────────────────────
@app.websocket("/ws/audio")
async def audio_stream_endpoint(
    websocket: WebSocket,
    scenario: str = "General Professional Call",
    source_language: str = "English",
    target_language: str = "Chinese (中文)",
    token: str = "",  # Clerk session token passed as query param
):
    # Verify token before accepting
    if not token:
        await websocket.close(code=4001)
        return

    try:
        # Re-use the same verification logic
        class FakeCreds:
            credentials = token

        user_id = await verify_clerk_token(FakeCreds())
    except HTTPException:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    print(f"🟢 Connected | User: {user_id} | {source_language} → {target_language}")

    dg_lang = DEEPGRAM_LANG_CODES.get(source_language, "en-US")
    transcript_buffer = ""

    try:
        dg_connection = deepgram.listen.asyncwebsocket.v("1")

        async def on_message(self, result, **kwargs):
            nonlocal transcript_buffer
            sentence = result.channel.alternatives[0].transcript
            is_final = result.is_final
            speech_final = getattr(result, "speech_final", False)

            if sentence and is_final:
                print(f"🎤 Heard: {sentence}")
                await websocket.send_text(json.dumps({"transcript": sentence}))
                transcript_buffer += sentence + " "

            if speech_final and len(transcript_buffer.strip()) > 0:
                current_transcript = transcript_buffer.strip()
                print(f"🗣️ Speech Final Triggered! Processing: {current_transcript}")

                # 1. Call LLM to get response
                ml_response = await process_audio_transcript(
                    current_transcript, scenario, source_language, target_language
                )

                # 2. ⚡ Core acceleration: Directly throw the task of writing to the database into the background without waiting for it to complete!
                asyncio.create_task(
                    save_record_bg(
                        user_id=user_id,
                        scenario=scenario,
                        source_language=source_language,
                        target_language=target_language,
                        transcript=current_transcript,
                        summary=ml_response.get("summary", ""),
                        translation=ml_response.get("translation", ""),
                        replies=ml_response.get("replies", []),
                    )
                )

                # 3. Zero delay, immediately push the LLM's response to the frontend
                ml_response.pop("transcript", None)
                await websocket.send_text(json.dumps(ml_response))

                # 4. Clear the buffer to prepare for the next sentence
                transcript_buffer = ""

        async def on_error(self, error, **kwargs):
            print(f"⚠️ Deepgram Error: {error}")

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

        endpointing_ms = get_endpointing_value(scenario)
        print(f"🎯 Endpointing: {endpointing_ms}ms for scenario: {scenario}")
        options = LiveOptions(
            model="nova-3",
            language=dg_lang,
            smart_format=True,
            endpointing=endpointing_ms,
        )
        if not await dg_connection.start(options):
            print("🔴 Failed to connect to Deepgram.")
            return

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
