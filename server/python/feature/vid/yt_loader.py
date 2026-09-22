
import re

from youtube_transcript_api import YouTubeTranscriptApi
from langchain_core.documents import Document


def extract_youtube_video_id(url: str) -> str | None:
    """Extract the video ID from a YouTube URL."""

    pattern = (
        r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|v/|shorts/)"
        r"|youtu\.be/)([a-zA-Z0-9_-]{11})"
    )

    match = re.search(pattern, url)

    return match.group(1) if match else None


def load_youtube_transcript(url: str):
    """Fetch a YouTube transcript and return LangChain documents."""

    video_id = extract_youtube_video_id(url)

    if not video_id:
        raise ValueError("Invalid YouTube URL")

    ytt_api = YouTubeTranscriptApi()
    transcript = ytt_api.fetch(video_id)

    transcript_text = " ".join(
        snippet.text for snippet in transcript
    )

    document = Document(
        page_content=transcript_text,
        metadata={
            "source": url,
            "video_id": video_id
        }
    )

    return [document]