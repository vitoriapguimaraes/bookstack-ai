from fastapi import APIRouter, HTTPException, Response
from pathlib import Path
import tempfile
import hashlib
import requests

router = APIRouter()

CACHE_DIR = Path(tempfile.gettempdir()) / "image_cache"
try:
    CACHE_DIR.mkdir(exist_ok=True)
except Exception:
    pass


def _get_cached_image(cache_path: Path, url: str):
    try:
        if cache_path.exists():
            content_type = "image/jpeg"
            if url.lower().endswith(".png"):
                content_type = "image/png"
            elif url.lower().endswith(".webp"):
                content_type = "image/webp"
            return Response(content=cache_path.read_bytes(), media_type=content_type)
    except Exception:
        pass
    return None


def _fetch_and_cache_image(url: str, cache_path: Path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code != 200:
            return None, "Failed to fetch image"

        content = response.content
        try:
            cache_path.write_bytes(content)
        except Exception:
            pass  # ignore cache write errors

        return (
            Response(
                content=content,
                media_type=response.headers.get("Content-Type", "image/jpeg"),
            ),
            None,
        )
    except Exception as e:
        return None, str(e)


@router.get("/proxy/image")
async def proxy_image(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    url_hash = hashlib.md5(url.encode()).hexdigest()
    cache_path = CACHE_DIR / url_hash

    # 1. Tenta Cache
    cached = _get_cached_image(cache_path, url)
    if cached:
        return cached

    # 2. Busca
    response, error = _fetch_and_cache_image(url, cache_path)
    if response:
        return response

    if error == "Failed to fetch image":
        raise HTTPException(status_code=400, detail=error)
    raise HTTPException(status_code=500, detail="Internal server error")
