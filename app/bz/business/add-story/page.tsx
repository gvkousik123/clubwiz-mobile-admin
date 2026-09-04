'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Camera, X } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import '../new-event/styles.css';

export default function AddStoryPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeCategory, setActiveCategory] = useState('Music Hashtags');
    const [showRecent, setShowRecent] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Gallery images from public/gallery folder
    const galleryImages = [
        '/gallery/Frame 1000001117.jpg',
        '/gallery/Frame 1000001119.jpg',
        '/gallery/Frame 1000001120.jpg',
        '/gallery/Frame 1000001121.jpg',
        '/gallery/Frame 1000001123.jpg',
        '/gallery/Frame 1000001124.jpg',
        '/gallery/Frame 1000001126.jpg',
        '/gallery/Frame 1000001127.jpg',
        '/gallery/Frame 1000001128.jpg'
    ];

    // Sample categories
    const categories = [
        'Music Hashtags',
        'Club Vibes',
        'DJ Performance',
        'Night Life'
    ];

    const handleGoBack = () => {
        router.back();
    };

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
    };

    const toggleRecent = () => {
        setShowRecent(!showRecent);
    };

    const handleCameraUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageSelect = (imagePath: string) => {
        console.log('Selected image:', imagePath);
        setSelectedImage(imagePath);
    };

    const handleCloseFullView = () => {
        setSelectedImage(null);
    };

    const handleAddToStory = () => {
        console.log('Adding to story:', selectedImage);
        // Here you would handle saving the image to the story
        // After saving, close the full view
        setSelectedImage(null);
    };

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {selectedImage ? (
                // Full view of selected image with bottom action bar
                <div className="min-h-screen relative bg-black">
                    {/* Close button with glassmorphism effect */}
                    <div className="absolute top-6 left-6 z-10">
                        <div className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center">
                            <button
                                onClick={handleCloseFullView}
                                className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Full size image */}
                    <img
                        src={selectedImage}
                        alt="Selected story image"
                        className="w-full h-full object-cover fixed inset-0"
                    />

                    {/* Tag */}
                    <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
                        <div className="bg-[#014A4B] border border-[#0FD8E2] text-white font-semibold py-1 px-4 rounded-full text-sm">
                            #TECHNONIGHT
                        </div>
                    </div>

                    {/* Bottom action bar - styled like new-club */}
                    <div className="fixed bottom-0 app-bar z-50">
                        <div className="w-full h-[80px] relative bg-[#0D1F1F] shadow-[0px_30px_30px_-40px_#00968A_inset] overflow-hidden rounded-t-[40px] border-t-2 border-[#14FFEC]">
                            <div className="flex items-center h-full px-5 gap-3 justify-center">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#14FFEC] flex-shrink-0">
                                    <img
                                        src="/vibemeter/Screenshot_2025-05-16_192139-removebg-preview.png"
                                        alt="Club logo"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://placehold.co/200x200?text=Club";
                                        }}
                                    />
                                </div>
                                <div className="w-[80%] h-[45px]">
                                    <button
                                        onClick={handleAddToStory}
                                        className="w-full h-full bg-[#0F6861] rounded-[30px] flex justify-center items-center cursor-pointer"
                                    >
                                        <span className="text-center text-white text-[16px] font-['Manrope'] font-bold tracking-[0.05px]">
                                            Add to Story
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="pt-6 px-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleGoBack}
                                className="w-10 h-10 bg-[#0D1F1F] rounded-full flex items-center justify-center"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                            <h1 className="text-xl font-semibold text-center flex-1 mr-10">Add to Story</h1>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="mt-4 px-4">
                        <div className="flex items-center justify-center">
                            <div className="bg-[#0D1F1F] py-2 px-6 rounded-full">
                                <span className="text-white font-medium">{activeCategory}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Toggle */}
                    <div className="mt-8 px-6">
                        <div
                            className="flex items-center cursor-pointer"
                            onClick={toggleRecent}
                        >
                            <span className="text-white font-semibold">Recent</span>
                            <ChevronDown
                                className={`ml-2 text-white w-5 h-5 transition-transform ${showRecent ? 'transform rotate-180' : ''
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="px-5 mt-4 pb-24">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Camera/Upload Box */}
                            <div
                                className="aspect-[3/5] bg-[#0D1F1F] rounded-lg flex items-center justify-center cursor-pointer"
                                onClick={handleCameraUpload}
                            >
                                <div className="w-10 h-10 bg-[#14FFEC] rounded-full flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-black" />
                                </div>
                            </div>

                            {/* Gallery Images */}
                            {galleryImages.map((image, index) => (
                                <div
                                    key={index}
                                    className={`aspect-[3/5] bg-[#0D1F1F] rounded-lg overflow-hidden cursor-pointer ${index === 1 ? 'border-2 border-[#14FFEC]' : ''
                                        }`}
                                    onClick={() => handleImageSelect(image)}
                                >
                                    <img
                                        src={image}
                                        alt={`Gallery image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
}
