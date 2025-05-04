"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { compressImage } from '@/lib/utils/imageCompression';
import ImageCropper from './ImageCropper';
import Image from 'next/image';

interface ProfilePictureProps {
  imageUrl?: string;
  onImageUpdate: (file: File) => Promise<string>;
  onImageDelete: () => Promise<void>;
}

export default function ProfilePicture({ imageUrl, onImageUpdate, onImageDelete }: ProfilePictureProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(imageUrl);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setIsUploading(true);

      // Compress the cropped image
      const compressed = await compressImage(croppedFile, 4096, 4096, 1.0);
      
      // Upload and get final URL
      const uploadedUrl = await onImageUpdate(compressed.file);
      setPreviewUrl(uploadedUrl);

      // Cleanup
      setCropperImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
      // Revert to previous image on error
      setPreviewUrl(imageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!previewUrl) return;
    
    if (confirm('Are you sure you want to delete your profile picture?')) {
      try {
        setIsDeleting(true);
        await onImageDelete();
        setPreviewUrl(undefined);
      } catch (error) {
        console.error('Error deleting profile picture:', error);
        alert('Failed to delete profile picture. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div className="relative w-32 h-32 mx-auto group">
        {/* Profile Picture */}
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile picture"
              width={128}
              height={128}
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CameraIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Overlay with upload/delete buttons */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
              disabled={isUploading}
            >
              <CameraIcon className="w-5 h-5 text-gray-700" />
            </button>
            {previewUrl && (
              <button
                onClick={handleDelete}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                disabled={isDeleting}
              >
                <TrashIcon className="w-5 h-5 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image cropper modal */}
      {cropperImage && (
        <ImageCropper
          imageUrl={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropperImage(null);
            resetFileInput();
          }}
          aspectRatio={1}
        />
      )}
    </>
  );
} 