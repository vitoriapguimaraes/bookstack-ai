from supabase import create_client, Client
from app.core.config import settings

supabase: Client = (
    create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    if settings.SUPABASE_URL and settings.SUPABASE_KEY
    else None
)


def upload_file_to_bucket(
    bucket_name: str, file_path: str, file_content: bytes, content_type: str
) -> str:
    """
    Uploads a file to Supabase Storage, ensuring the bucket exists.
    Returns the public URL of the uploaded file.
    """
    if not supabase:
        raise Exception("Supabase Storage not configured")

    try:
        supabase.storage.from_(bucket_name).upload(
            file_path, file_content, {"content-type": content_type}
        )
    except Exception as e:
        # Check for bucket not found error and try to create it
        if "Bucket not found" in str(e) or "404" in str(e):
            try:
                supabase.storage.create_bucket(bucket_name, options={"public": True})
                # Retry upload
                supabase.storage.from_(bucket_name).upload(
                    file_path, file_content, {"content-type": content_type}
                )
            except Exception as create_err:
                print(f"Failed to create bucket '{bucket_name}': {create_err}")
                raise Exception(
                    f"Storage Error: Could not create '{bucket_name}' bucket."
                )
        else:
            raise e

    return supabase.storage.from_(bucket_name).get_public_url(file_path)
