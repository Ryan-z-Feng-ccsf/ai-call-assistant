from google import genai
from google.genai import types
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from the environment variables.")

client = genai.Client(api_key=api_key)

MODEL = "gemini-3.1-flash-lite-preview"


def _safe_parse(text: str) -> dict:
    """
    Robustly parse JSON from Gemini's response.
    Handles unescaped control characters (newlines inside string values)
    that occasionally slip through even with response_mime_type=application/json.
    """
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Replace literal unescaped control characters inside the raw string
        # (tab, newline, carriage return) with their escaped equivalents,
        # but only when they appear inside JSON string values.
        cleaned = re.sub(
            r'(?<!\\)([\x00-\x1f\x7f])',
            lambda m: repr(m.group())[1:-1],
            text
        )
        return json.loads(cleaned)


async def process_audio_transcript(
    transcript_block: str,
    scenario: str,
    source_language: str = "English",
    target_language: str = "Chinese (中文)",
) -> dict:
    """
    Summarizes, translates from source_language → target_language,
    and generates bilingual suggested replies.
    """
    system_prompt = f"""
    You are an expert communication assistant helping someone during a: {scenario}.
    The speaker is talking in: {source_language}.
    The user wants everything translated into: {target_language}.

    Here is what was just said (in {source_language}):
    "{transcript_block}"

    Respond with a JSON object containing EXACTLY these keys:
    1. "summary": A brief summary written in {target_language} of what was said.
    2. "translation": A full translation of the transcript into {target_language}.
    3. "replies": A list of 3 suggested replies the user could say back (in {source_language}, since that is the conversation language).
       CRITICAL: Each reply MUST be bilingual — {target_language} on top so the user understands it, {source_language} expression below so they can say it.
       Format EACH string exactly like this:
       "[{target_language} meaning]\\n[{source_language} expression]"
    """

    try:
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=system_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        processed_data = _safe_parse(response.text)
        return processed_data

    except Exception as e:
        print(f"⚠️ LLM Processing Error: {e}")
        return {
            "transcript": transcript_block,
            "summary": "Error generating summary.",
            "translation": "Error generating translation.",
            "replies": ["...", "...", "..."],
        }