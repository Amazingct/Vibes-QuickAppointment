import os
import sys
import tempfile
import shutil
import uuid
import boto3
from botocore.exceptions import ClientError
from contextlib import contextmanager
from typing import Optional, Dict, Any
from urllib.parse import urlparse
import logging

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpacesManager:
    """
    Manager class for DigitalOcean Spaces (S3-compatible) operations
    """
    
    def __init__(self, 
                 endpoint_url: str,
                 access_key: str,
                 secret_key: str,
                 bucket_name: str,
                 region: str = 'nyc3'):
        """
        Initialize Spaces client
        
        Args:
            endpoint_url: DigitalOcean Spaces endpoint (e.g., 'https://nyc3.digitaloceanspaces.com')
            access_key: Spaces access key
            secret_key: Spaces secret key
            bucket_name: Name of the Space (bucket)
            region: Region where the Space is located
        """
        self.bucket_name = bucket_name
        
        # Initialize boto3 client for DigitalOcean Spaces
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        
        logger.info(f"Initialized SpacesManager for bucket: {bucket_name}")
    
    def upload_file(self, 
                   local_file_path: str, 
                   spaces_key: str,
                   extra_args: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Upload a file to DigitalOcean Spaces
        
        Args:
            local_file_path: Path to the local file
            spaces_key: Key (path) in Spaces where file will be stored
            extra_args: Additional arguments (e.g., {'ACL': 'public-read'})
            
        Returns:
            str: Public URL if upload successful, None otherwise
        """
        try:
            if not os.path.exists(local_file_path):
                logger.error(f"Local file not found: {local_file_path}")
                return None
            
            # Clean the spaces_key to avoid bucket name duplication
            clean_key = spaces_key
            if clean_key.startswith(f"{self.bucket_name}/"):
                clean_key = clean_key[len(self.bucket_name) + 1:]
                logger.info(f"Removed bucket name from key: {spaces_key} -> {clean_key}")
            
            # Default extra args for public read access
            if extra_args is None:
                extra_args = {'ACL': 'public-read'}
            
            self.client.upload_file(
                local_file_path, 
                self.bucket_name, 
                clean_key,
                ExtraArgs=extra_args
            )
            
            # Generate public URL for DigitalOcean Spaces
            # The public URL format should be: https://bucket-name.region.digitaloceanspaces.com/file-path
            
            # For DigitalOcean Spaces, we construct the URL from the region
            # The endpoint is configured as: https://sfo3.digitaloceanspaces.com
            # But we need to construct: https://vibes-mc.sfo3.digitaloceanspaces.com
            
            try:
                # Get the region from the config (it should be something like 'sfo3')
                from config import Config
                region = Config.SPACES_REGION or 'sfo3'  # fallback to sfo3 if not set
                
                # Construct the public URL directly using the clean key
                public_url = f"https://{self.bucket_name}.{region}.digitaloceanspaces.com/{clean_key}"
                
            except Exception as e:
                logger.warning(f"Could not get region from config, using fallback: {e}")
                # Fallback: try to extract from endpoint
                endpoint_url = str(self.client._endpoint.host)
                if '://' in endpoint_url:
                    endpoint_url = endpoint_url.split('://')[-1]
                
                if 'digitaloceanspaces.com' in endpoint_url:
                    # Extract region from endpoint, handling potential bucket name prefix
                    if endpoint_url.startswith(self.bucket_name):
                        # Remove bucket name if it's prefixed
                        endpoint_url = endpoint_url[len(self.bucket_name):].lstrip('.')
                    
                    region = endpoint_url.split('.digitaloceanspaces.com')[0]
                    public_url = f"https://{self.bucket_name}.{region}.digitaloceanspaces.com/{clean_key}"
                else:
                    # Final fallback for other S3-compatible services
                    public_url = f"https://{self.bucket_name}.{endpoint_url}/{clean_key}"
            
            logger.info(f"Successfully uploaded {local_file_path} to {clean_key}")
            logger.info(f"Public URL: {public_url}")
            return public_url
            
        except ClientError as e:
            logger.error(f"Failed to upload file: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during upload: {e}")
            return None
    
    def download_file(self, 
                     spaces_key: str, 
                     local_file_path: str) -> Optional[str]:
        """
        Download a file from DigitalOcean Spaces
        
        Args:
            spaces_key: Key (path) in Spaces of the file to download
            local_file_path: Local path where file will be saved
            
        Returns:
            str: Local file path if download successful, None otherwise
        """
        try:
            # Create directory if it doesn't exist
            directory = os.path.dirname(local_file_path)
            if directory:  # Only create if there's a directory path
                os.makedirs(directory, exist_ok=True)
                logger.info(f"Ensured directory exists: {directory}")
            
            logger.info(f"Starting download of {spaces_key}...")
            self.client.download_file(
                self.bucket_name, 
                spaces_key, 
                local_file_path
            )
            
            logger.info(f"Successfully downloaded {spaces_key} to {local_file_path}")
            return local_file_path
            
        except ClientError as e:
            logger.error(f"Failed to download file: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during download: {e}")
            return None
    
    def delete_file(self, spaces_key: str) -> bool:
        """
        Delete a file from DigitalOcean Spaces
        
        Args:
            spaces_key: Key (path) in Spaces of the file to delete
            
        Returns:
            bool: True if deletion successful, False otherwise
        """
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=spaces_key
            )
            
            logger.info(f"Successfully deleted {spaces_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete file: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during deletion: {e}")
            return False
    
    def list_files(self, prefix: str = '') -> list:
        """
        List files in DigitalOcean Spaces with optional prefix
        
        Args:
            prefix: Prefix to filter files (like folder path)
            
        Returns:
            list: List of file keys
        """
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            if 'Contents' in response:
                files = [obj['Key'] for obj in response['Contents']]
            
            logger.info(f"Found {len(files)} files with prefix '{prefix}'")
            return files
            
        except ClientError as e:
            logger.error(f"Failed to list files: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during file listing: {e}")
            return []
    
    def get_file_url(self, spaces_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for a file in Spaces
        
        Args:
            spaces_key: Key (path) in Spaces of the file
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            str: Presigned URL or None if failed
        """
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': spaces_key},
                ExpiresIn=expiration
            )
            
            logger.info(f"Generated presigned URL for {spaces_key}")
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating URL: {e}")
            return None
    
    def upload_file_object(self, 
                          file_obj, 
                          spaces_key: str,
                          content_type: Optional[str] = None,
                          make_unique: bool = True) -> Optional[str]:
        """
        Upload a file object (like from Flask request) to DigitalOcean Spaces
        
        Args:
            file_obj: File object to upload (e.g., from request.files)
            spaces_key: Key (path) in Spaces where file will be stored
            content_type: MIME type of the file
            make_unique: If True, adds UUID to filename to ensure uniqueness
            
        Returns:
            str: Public URL if upload successful, None otherwise
        """
        try:
            # Clean the spaces_key to avoid bucket name duplication
            clean_key = spaces_key
            if clean_key.startswith(f"{self.bucket_name}/"):
                clean_key = clean_key[len(self.bucket_name) + 1:]
                logger.info(f"Removed bucket name from key: {spaces_key} -> {clean_key}")
            
            # Make filename unique if requested
            if make_unique:
                name, ext = os.path.splitext(clean_key)
                unique_key = f"{name}_{uuid.uuid4()}{ext}"
            else:
                unique_key = clean_key
            
            # Prepare extra arguments
            extra_args = {'ACL': 'public-read'}
            if content_type:
                extra_args['ContentType'] = content_type
            
            # Upload file object
            self.client.upload_fileobj(
                file_obj,
                self.bucket_name,
                unique_key,
                ExtraArgs=extra_args
            )
            
            # Generate public URL using config
            try:
                from config import Config
                region = Config.SPACES_REGION or 'sfo3'
                public_url = f"https://{self.bucket_name}.{region}.digitaloceanspaces.com/{unique_key}"
            except Exception:
                # Fallback URL construction
                public_url = f"https://{self.bucket_name}.sfo3.digitaloceanspaces.com/{unique_key}"
            
            logger.info(f"Successfully uploaded file object to {unique_key}")
            logger.info(f"Public URL: {public_url}")
            return public_url
            
        except ClientError as e:
            logger.error(f"Failed to upload file object: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during file object upload: {e}")
            return None
    
    def download_from_url(self, 
                         spaces_url: str, 
                         download_folder: str = "Downloaded") -> Optional[str]:
        """
        Download a file from Spaces using its public URL
        
        Args:
            spaces_url: Full URL to the file (e.g., "https://bucket.region.digitaloceanspaces.com/path/file.pdf")
            download_folder: Local folder to save the file
            
        Returns:
            str: Path to downloaded file or None if failed
        """
        try:
            # Create download directory if it doesn't exist
            if not os.path.exists(download_folder):
                os.makedirs(download_folder)
                logger.info(f"Created download directory: {download_folder}")
            
            # Parse URL to extract object key
            parsed_url = urlparse(spaces_url)
            path = parsed_url.path.lstrip('/')
            
            # Extract object key (remove bucket name from path if present)
            if path.startswith(f"{self.bucket_name}/"):
                object_key = path[len(self.bucket_name) + 1:]
            else:
                object_key = path
            
            # Generate unique local filename
            file_extension = os.path.splitext(object_key)[1] or '.bin'
            local_filename = f"{uuid.uuid4()}{file_extension}"
            local_path = os.path.join(download_folder, local_filename)
            
            # Download file
            logger.info(f"Starting URL download...")
            self.client.download_file(self.bucket_name, object_key, local_path)
            
            logger.info(f"Downloaded from {spaces_url} to {local_path}")
            return local_path
            
        except ClientError as e:
            logger.error(f"Failed to download from URL: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during URL download: {e}")
            return None


class TempDirectoryManager:
    """
    Manager class for temporary directory operations with automatic cleanup
    """
    
    @staticmethod
    @contextmanager
    def get_temp_dir(prefix: str = 'temp_', suffix: str = ''):
        """
        Context manager that creates a temporary directory and automatically deletes it
        
        Args:
            prefix: Prefix for the temporary directory name
            suffix: Suffix for the temporary directory name
            
        Yields:
            str: Path to the temporary directory
            
        Example:
            with TempDirectoryManager.get_temp_dir() as temp_dir:
                # Use temp_dir for operations
                file_path = os.path.join(temp_dir, 'myfile.txt')
                # Directory is automatically deleted when exiting the context
        """
        temp_dir = None
        try:
            # Create temporary directory
            temp_dir = tempfile.mkdtemp(prefix=prefix, suffix=suffix)
            logger.info(f"Created temporary directory: {temp_dir}")
            
            yield temp_dir
            
        except Exception as e:
            logger.error(f"Error in temporary directory context: {e}")
            raise
        finally:
            # Cleanup: Delete temporary directory and all contents
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                    logger.info(f"Cleaned up temporary directory: {temp_dir}")
                except Exception as e:
                    logger.error(f"Failed to cleanup temporary directory {temp_dir}: {e}")
    
    @staticmethod
    def get_temp_file(suffix: str = '', prefix: str = 'temp_', delete: bool = False):
        """
        Create a temporary file
        
        Args:
            suffix: File extension (e.g., '.txt', '.json')
            prefix: Prefix for the temporary file name
            delete: If True, file is deleted when closed
            
        Returns:
            tuple: (file_descriptor, file_path)
        """
        try:
            fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix, delete=delete)
            logger.info(f"Created temporary file: {path}")
            return fd, path
        except Exception as e:
            logger.error(f"Failed to create temporary file: {e}")
            raise


def create_spaces_manager_from_config() -> Optional[SpacesManager]:
    """
    Create SpacesManager instance from config.py configuration
    
    Returns:
        SpacesManager instance or None if configuration is incomplete
    """
    try:
        from config import Config
        
        endpoint_url = Config.SPACES_ENDPOINT_URL
        access_key = Config.SPACES_ACCESS_KEY
        secret_key = Config.SPACES_SECRET_KEY
        bucket_name = Config.SPACES_BUCKET_NAME
        region = Config.SPACES_REGION
        
        if not all([endpoint_url, access_key, secret_key, bucket_name]):
            logger.error("Missing required Spaces configuration in config.py")
            return None
        
        return SpacesManager(
            endpoint_url=endpoint_url,
            access_key=access_key,
            secret_key=secret_key,
            bucket_name=bucket_name,
            region=region
        )
        
    except Exception as e:
        logger.error(f"Failed to create SpacesManager from config: {e}")
        return None


def create_spaces_manager_from_env() -> Optional[SpacesManager]:
    """
    Create SpacesManager instance from environment variables (legacy support)
    
    Deprecated: Use create_spaces_manager_from_config() instead
    
    Returns:
        SpacesManager instance or None if configuration is incomplete
    """
    try:
        endpoint_url = os.getenv('SPACES_ENDPOINT_URL')
        access_key = os.getenv('SPACES_ACCESS_KEY')
        secret_key = os.getenv('SPACES_SECRET_KEY')
        bucket_name = os.getenv('SPACES_BUCKET_NAME')
        region = os.getenv('SPACES_REGION', 'nyc3')
        
        if not all([endpoint_url, access_key, secret_key, bucket_name]):
            logger.error("Missing required environment variables for Spaces configuration")
            return None
        
        return SpacesManager(
            endpoint_url=endpoint_url,
            access_key=access_key,
            secret_key=secret_key,
            bucket_name=bucket_name,
            region=region
        )
        
    except Exception as e:
        logger.error(f"Failed to create SpacesManager from environment: {e}")
        return None


# Utility functions for common operations
def upload_to_spaces(local_path: str, spaces_key: str, use_config: bool = True) -> Optional[str]:
    """
    Utility function to upload a file to spaces using configuration
    
    Args:
        local_path: Path to local file
        spaces_key: Key in spaces where file will be stored
        use_config: If True, use config.py; if False, use environment variables
        
    Returns:
        str: Public URL if successful, None otherwise
    """
    if use_config:
        spaces_manager = create_spaces_manager_from_config()
    else:
        spaces_manager = create_spaces_manager_from_env()
    
    if not spaces_manager:
        return None
    
    return spaces_manager.upload_file(local_path, spaces_key)


def download_from_spaces(spaces_key: str, local_path: str, use_config: bool = True) -> Optional[str]:
    """
    Utility function to download a file from spaces using configuration
    
    Args:
        spaces_key: Key in spaces of file to download
        local_path: Local path where file will be saved
        use_config: If True, use config.py; if False, use environment variables
        
    Returns:
        str: Local file path if successful, None otherwise
    """
    if use_config:
        spaces_manager = create_spaces_manager_from_config()
    else:
        spaces_manager = create_spaces_manager_from_env()
    
    if not spaces_manager:
        return None
    
    return spaces_manager.download_file(spaces_key, local_path)


def delete_from_spaces(spaces_key: str, use_config: bool = True) -> bool:
    """
    Utility function to delete a file from spaces using configuration
    
    Args:
        spaces_key: Key in spaces of file to delete
        use_config: If True, use config.py; if False, use environment variables
        
    Returns:
        bool: True if successful, False otherwise
    """
    if use_config:
        spaces_manager = create_spaces_manager_from_config()
    else:
        spaces_manager = create_spaces_manager_from_env()
    
    if not spaces_manager:
        return False
    
    return spaces_manager.delete_file(spaces_key)


def delete_local_file(file_path: str) -> bool:
    """
    Utility function to delete a local file
    
    Args:
        file_path: Path to local file to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Successfully deleted local file: {file_path}")
            return True
        else:
            logger.warning(f"File not found for deletion: {file_path}")
            return False
    except Exception as e:
        logger.error(f"Failed to delete local file {file_path}: {e}")
        return False


def upload_flask_file_to_spaces(file_obj, 
                                spaces_key: str,
                                content_type: Optional[str] = None,
                                make_unique: bool = True,
                                use_config: bool = True) -> Optional[str]:
    """
    Utility function to upload Flask file object to spaces
    
    Args:
        file_obj: File object from Flask request.files
        spaces_key: Key in spaces where file will be stored
        content_type: MIME type of the file
        make_unique: If True, adds UUID to filename to ensure uniqueness
        use_config: If True, use config.py; if False, use environment variables
        
    Returns:
        str: Public URL if successful, None otherwise
    """
    if use_config:
        spaces_manager = create_spaces_manager_from_config()
    else:
        spaces_manager = create_spaces_manager_from_env()
    
    if not spaces_manager:
        return None
    
    return spaces_manager.upload_file_object(file_obj, spaces_key, content_type, make_unique)


def download_from_spaces_url(spaces_url: str, 
                           download_folder: str = "Downloaded",
                           use_config: bool = True) -> Optional[str]:
    """
    Utility function to download file from spaces using URL
    
    Args:
        spaces_url: Full URL to the file in Spaces
        download_folder: Local folder to save the file
        use_config: If True, use config.py; if False, use environment variables
        
    Returns:
        str: Local file path if successful, None otherwise
    """
    if use_config:
        spaces_manager = create_spaces_manager_from_config()
    else:
        spaces_manager = create_spaces_manager_from_env()
    
    if not spaces_manager:
        return None
    
    return spaces_manager.download_from_url(spaces_url, download_folder)


def process_file_with_temp_storage(file_processor_func, *args, **kwargs):
    """
    Process a file using temporary storage
    
    Args:
        file_processor_func: Function that processes files
        *args, **kwargs: Arguments to pass to the processor function
        
    Example:
        def my_processor(temp_dir, input_file):
            # Process file in temp_dir
            output_file = os.path.join(temp_dir, 'processed.txt')
            # ... processing logic ...
            return output_file
        
        result = process_file_with_temp_storage(my_processor, 'input.txt')
    """
    with TempDirectoryManager.get_temp_dir() as temp_dir:
        return file_processor_func(temp_dir, *args, **kwargs)


if __name__ == "__main__":
    # Example usage
    print("File operations module loaded successfully!")
    
    # Example: Using temporary directory
    with TempDirectoryManager.get_temp_dir() as temp_dir:
        print(f"Working in temporary directory: {temp_dir}")
        
        # Create a test file
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, 'w') as f:
            f.write("Hello, temporary file!")
        
        print(f"Created test file: {test_file}")
        # Directory and file will be automatically deleted when exiting context
    
    print("Temporary directory has been cleaned up automatically!")
