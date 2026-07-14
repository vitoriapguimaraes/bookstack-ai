import requests
from app.core.config import settings


class SupabaseStorageClient:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else None
        self.key = settings.SUPABASE_KEY

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def upload(
        self, bucket_name: str, file_path: str, file_content: bytes, content_type: str
    ) -> str:
        if not self.is_configured():
            raise Exception("Supabase Storage not configured")

        response = requests.post(
            f"{self.url}/storage/v1/object/{bucket_name}/{file_path}",
            data=file_content,
            headers={
                "Authorization": f"Bearer {self.key}",
                "apikey": self.key,
                "Content-Type": content_type,
            },
            timeout=60,
        )

        if response.status_code >= 400:
            raise Exception(
                f"Supabase Storage upload failed: {response.status_code} {response.text}"
            )

        return f"{self.url}/storage/v1/object/public/{bucket_name}/{file_path}"


storage_client = SupabaseStorageClient()


def upload_file_to_bucket(
    bucket_name: str, file_path: str, file_content: bytes, content_type: str
) -> str:
    """
    Uploads a file to Supabase Storage using the REST API with the service role key.
    Returns the public URL of the uploaded file.
    """
    if not storage_client.is_configured():
        raise Exception("Supabase Storage not configured")

    try:
        return storage_client.upload(bucket_name, file_path, file_content, content_type)
    except Exception as e:
        raise Exception(
            f"Supabase error: {e} | Key ends with: {storage_client.key[-10:] if storage_client.key else 'None'}"
        )
