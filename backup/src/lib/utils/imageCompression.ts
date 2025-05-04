"use client";

interface CompressedImage {
  file: File;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth = 4096,
  maxHeight = 4096,
  quality = 0.95
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Calculate the device pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Adjust max dimensions based on device pixel ratio
        const adjustedMaxWidth = maxWidth * pixelRatio;
        const adjustedMaxHeight = maxHeight * pixelRatio;
        
        if (width > adjustedMaxWidth) {
          height = Math.round((height * adjustedMaxWidth) / width);
          width = adjustedMaxWidth;
        }
        
        if (height > adjustedMaxHeight) {
          width = Math.round((width * adjustedMaxHeight) / height);
          height = adjustedMaxHeight;
        }

        // Create canvas with high DPI support
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: true
        });
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);

        // Apply enhanced sharpening
        const imageData = ctx.getImageData(0, 0, width, height);
        const sharpened = enhanceImage(imageData);
        ctx.putImageData(sharpened, 0, 0);

        // Convert to file with appropriate quality based on file type
        const outputType = getOptimalImageType(file.type);
        const outputQuality = getOptimalQuality(file.type, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${outputType}`),
              {
                type: `image/${outputType}`,
                lastModified: Date.now(),
              }
            );

            resolve({
              file: compressedFile,
              width,
              height,
            });
          },
          `image/${outputType}`,
          outputQuality
        );
      };

      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };
  });
}

// Helper function to determine optimal image type
function getOptimalImageType(inputType: string): string {
  if (inputType.includes('png')) return 'png';
  if (inputType.includes('webp')) return 'webp';
  return 'jpeg';
}

// Helper function to determine optimal quality based on image type
function getOptimalQuality(inputType: string, baseQuality: number): number {
  if (inputType.includes('png')) return 1; // PNG is lossless
  if (inputType.includes('webp')) return baseQuality;
  return baseQuality;
}

// Enhanced image processing
function enhanceImage(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // First pass: Apply unsharp mask with reduced intensity
  const sharpened = unsharpMask(imageData, 0.3, 0.5, 0);
  
  // Second pass: Enhance contrast with reduced factor
  const enhanced = enhanceContrast(sharpened, 1.05);
  
  return enhanced;
}

// Unsharp mask algorithm for better sharpening
function unsharpMask(imageData: ImageData, amount: number, radius: number, threshold: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  // Create a temporary canvas for the blur
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return imageData;
  
  // Draw the original image
  tempCtx.putImageData(imageData, 0, 0);
  
  // Apply Gaussian blur
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);
  
  // Get the blurred image data
  const blurredData = tempCtx.getImageData(0, 0, width, height).data;
  
  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    const diff = data[i] - blurredData[i];
    if (Math.abs(diff) > threshold) {
      output[i] = Math.min(255, Math.max(0, data[i] + diff * amount));
      output[i + 1] = Math.min(255, Math.max(0, data[i + 1] + diff * amount));
      output[i + 2] = Math.min(255, Math.max(0, data[i + 2] + diff * amount));
    }
  }
  
  return new ImageData(output, width, height);
}

// Contrast enhancement
function enhanceContrast(imageData: ImageData, factor: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      const value = data[i + j];
      const enhanced = ((value - 128) * factor) + 128;
      output[i + j] = Math.min(255, Math.max(0, enhanced));
    }
  }
  
  return new ImageData(output, width, height);
} 