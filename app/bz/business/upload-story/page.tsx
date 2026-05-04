'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, ImageIcon, VideoIcon, Trash2, X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { StoryService } from '@/lib/services/story.service';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/image-utils';
import { getClubId } from '@/lib/utils/get-club-id';

export const dynamic = 'force-dynamic';

function UploadStoryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [clubId, setClubId] = useState<string | null>(null);

    // Get clubId from URL or localStorage on mount
    useEffect(() => {
        const cid = getClubId(searchParams);
        
        if (cid) {
            setClubId(cid);
            console.log('✓ ClubId found:', cid);
        } else {
            console.error('✗ No clubId found in URL or localStorage');
            toast({
                title: 'Error',
                description: 'No club found. Please go back and try again.',
                variant: 'destructive'
            });
            setTimeout(() => router.push('/bz/business'), 1500);
        }
    }, [searchParams, toast, router]);

    const handleGoBack = () => {
        router.back();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            toast({
                title: 'Invalid File',
                description: 'Please select an image or video file',
                variant: 'destructive'
            });
            return;
        }

        // Check file size
        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
        if (file.size > maxSize) {
            toast({
                title: 'File Too Large',
                description: `File size must be less than ${isImage ? '10MB' : '50MB'}`,
                variant: 'destructive'
            });
            return;
        }

        setSelectedFile(file);
        setFileType(isImage ? 'image' : 'video');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreview(null);
        setFileType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast({
                title: 'No File Selected',
                description: 'Please select a file to upload',
                variant: 'destructive'
            });
            return;
        }

        if (!clubId) {
            toast({
                title: 'Error',
                description: 'Club ID not found. Please try again.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setIsUploading(true);

            // Convert file to base64
            const base64Data = await fileToBase64(selectedFile);

            // Use async endpoint for videos, sync endpoint for images
            const isVideo = fileType === 'video';
            const uploadMethod = isVideo ? 'uploadStoryAsync' : 'uploadStory';
            
            const result = await StoryService[uploadMethod]({
                base64Data,
                caption: caption.trim() || undefined,
                fileName: selectedFile.name,
                clubId: clubId
            });
            console.log('Upload result:', result);

            // Always show success and navigate
            toast({
                title: 'Success',
                description: `Story uploaded successfully!${isVideo ? ' (Processing video...)' : ''}`,
                className: 'bg-green-600 text-white'
            });
            // Clear form
            handleRemoveFile();
            setCaption('');
            // Navigate to my stories page - replace so back button goes to /admin
            setTimeout(() => {
                router.replace('/bz/business/my-stories');
            }, 500);
        } catch (error: any) {
            console.error('Error uploading story:', error);
            toast({
                title: 'Upload Failed',
                description: error.message || 'Failed to upload story',
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-10 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="absolute top-10 left-6">
                    <button
                        onClick={handleGoBack}
                        className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-full transition-all duration-300"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <h1 className="text-xl font-bold text-white">Upload Story</h1>
                    <p className="text-sm text-white/80 mt-1">Share your moment • Expires in 24 hours</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pt-[160px] pb-24">
                {/* Uploading Indicator */}
                {isUploading && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-[#0D1F1F] rounded-[20px] p-8 flex flex-col items-center gap-4 border border-[#14FFEC]">
                            <div className="w-12 h-12 border-4 border-[#14FFEC] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-white font-semibold text-center">Uploading your story...</p>
                            <p className="text-gray-400 text-sm text-center">Please wait, this may take a moment</p>
                        </div>
                    </div>
                )}

                {/* File Upload Section */}
                {!preview ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div
                            onClick={handleClickUpload}
                            className="w-full max-w-md bg-[#0D1F1F] border-2 border-dashed border-[#14FFEC] rounded-[20px] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0D1F1F]/70 transition-all"
                        >
                            <div className="w-20 h-20 bg-[#14FFEC]/20 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-10 h-10 text-[#14FFEC]" />
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Choose a file</h3>
                            <p className="text-gray-400 text-sm text-center mb-4">
                                Images (JPG, JPEG, PNG, GIF, WEBP, BMP) up to 10MB
                                <br />
                                Videos (MP4, MOV, AVI, MKV, WEBM, 3GP) up to 50MB
                            </p>
                            <div className="flex gap-4 mt-4">
                                <div className="flex flex-col items-center">
                                    <ImageIcon className="w-8 h-8 text-[#14FFEC] mb-1" />
                                    <span className="text-xs text-gray-400">Image</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <VideoIcon className="w-8 h-8 text-[#14FFEC] mb-1" />
                                    <span className="text-xs text-gray-400">Video</span>
                                </div>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,video/mp4,video/mov,video/avi,video/mkv,video/webm,video/3gp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Preview */}
                        <div className="relative">
                            <div className="bg-[#0D1F1F] border border-[#14FFEC] rounded-[20px] p-4 overflow-hidden">
                                {fileType === 'image' ? (
                                    <img
                                        src={preview}
                                        alt="Story preview"
                                        className="w-full h-auto max-h-[500px] object-contain rounded-[15px]"
                                    />
                                ) : (
                                    <video
                                        src={preview}
                                        controls
                                        className="w-full h-auto max-h-[500px] rounded-[15px]"
                                    />
                                )}
                            </div>
                            <button
                                onClick={handleRemoveFile}
                                className="absolute top-6 right-6 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Caption Input */}
                        <div className="space-y-3">
                            <label className="text-[#14FFEC] font-semibold text-base px-2">
                                Caption (Optional)
                            </label>
                            <div className="bg-[#0D1F1F] border border-[#0C898B] rounded-[20px] p-4">
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    maxLength={500}
                                    placeholder="Add a caption to your story..."
                                    className="w-full bg-transparent text-white placeholder-[#9D9C9C] outline-none resize-none min-h-[100px] text-base"
                                />
                                <div className="text-right text-xs text-gray-500 mt-2">
                                    {caption.length}/500
                                </div>
                            </div>
                        </div>

                        {/* File Info */}
                        <div className="bg-[#0D1F1F]/50 border border-[#0C898B] rounded-[15px] p-4">
                            <div className="flex items-start justify-between text-sm gap-2">
                                <span className="text-gray-400 flex-shrink-0">File:</span>
                                <span className="text-white font-medium break-all text-right">{selectedFile?.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-400">Size:</span>
                                <span className="text-white">{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-400">Type:</span>
                                <span className="text-white capitalize">{fileType}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleRemoveFile}
                                className="flex-1 bg-[#0D1F1F] border border-[#0C898B] text-white py-4 rounded-[15px] font-semibold hover:bg-[#0D1F1F]/70 transition-all"
                            >
                                Change File
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex-1 bg-[#14FFEC] text-black py-4 rounded-[15px] font-semibold hover:bg-[#14FFEC]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Story'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UploadStoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#14FFEC] animate-spin" />
            </div>
        }>
            <UploadStoryContent />
        </Suspense>
    );
}



