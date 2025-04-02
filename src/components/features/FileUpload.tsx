'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { UploadCloud, X, File, CheckCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { ALLOWED_FILE_TYPES } from '@/config';

export default function FileUpload() {
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  
  const { 
    isUploading, 
    progress, 
    files, 
    error, 
    handleDrop, 
    resetUpload 
  } = useFileUpload({
    onUploadStart: () => {
      toast.info('Upload started');
    },
    onUploadComplete: (result) => {
      toast.success(result.message);
      setTimeout(() => {
        resetUpload();
        setIsDropzoneOpen(false);
      }, 2000);
    },
    onUploadError: (errorMsg) => {
      toast.error(errorMsg);
    }
  });
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled: isUploading,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.heic', '.heif'],
    },
    validator: (file) => null,
  });
  
  const renderUploadProgress = () => {
    if (!isUploading && files.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Upload Progress</span>
          <span>{progress}%</span>
        </div>
        
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="space-y-2 mt-3">
          {files.map((file, index) => (
            <div key={index} className="flex items-center text-sm">
              <File className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="flex-1 truncate">{file.file.name}</span>
              <span className="ml-2 text-neutral-500">{formatFileSize(file.file.size)}</span>
              {file.completed && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="mt-6">
      {!isDropzoneOpen ? (
        <Button 
          onClick={() => setIsDropzoneOpen(true)}
          className="w-full py-8 flex flex-col"
        >
          <UploadCloud className="h-6 w-6 mb-2" />
          <span>Upload Files</span>
        </Button>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setIsDropzoneOpen(false);
                  resetUpload();
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <UploadCloud className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              
              <p className="text-sm text-neutral-600 mb-1">
                {isDragActive 
                  ? 'Drop the files here...' 
                  : 'Drag and drop files here, or click to select files'}
              </p>
              
              <p className="text-xs text-neutral-500">
                Supported files: jpg, jpeg, png, gif, webp, svg, bmp, tiff
                <br />
                Maximum file size: 50MB
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {renderUploadProgress()}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 