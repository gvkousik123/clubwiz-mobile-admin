import React, { useState } from 'react';
import Image from 'next/image';

export interface FilterOption {
    id: string;
    label: string;
    icon?: string;
    selected?: boolean;
}

export interface FilterSection {
    id: string;
    title: string;
    type: 'radio' | 'checkbox';
    options: FilterOption[];
}

export interface FilterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: Record<string, any>) => void;
    sections: FilterSection[];
}

const FilterPopup: React.FC<FilterPopupProps> = ({
    isOpen,
    onClose,
    onApply,
    sections: initialSections
}) => {
    const [sections, setSections] = useState<FilterSection[]>(initialSections);

    const handleOptionToggle = (sectionId: string, optionId: string) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id !== sectionId) return section;

                if (section.type === 'radio') {
                    // For radio buttons, only one can be selected
                    return {
                        ...section,
                        options: section.options.map(option => ({
                            ...option,
                            selected: option.id === optionId
                        }))
                    };
                } else {
                    // For checkboxes, toggle the selection
                    return {
                        ...section,
                        options: section.options.map(option =>
                            option.id === optionId
                                ? { ...option, selected: !option.selected }
                                : option
                        )
                    };
                }
            })
        );
    };

    const handleApply = () => {
        const filters: Record<string, any> = {};
        sections.forEach(section => {
            if (section.type === 'radio') {
                const selected = section.options.find(opt => opt.selected);
                if (selected) {
                    filters[section.id] = selected.id;
                }
            } else {
                const selected = section.options.filter(opt => opt.selected).map(opt => opt.id);
                if (selected.length > 0) {
                    filters[section.id] = selected;
                }
            }
        });
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setSections(prevSections =>
            prevSections.map(section => ({
                ...section,
                options: section.options.map(option => ({
                    ...option,
                    selected: false
                }))
            }))
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Filter Panel */}
            <div className="relative w-full max-w-[430px] bg-[#021313] rounded-t-[20px] animate-slide-up max-h-[90vh] flex flex-col">
                <div className="w-full px-[23px] py-[28px] overflow-y-auto flex flex-col gap-[16px] flex-1 pb-[32px]">

                    {/* Dynamic Sections */}
                    {sections.map((section) => (
                        <div key={section.id} className={`bg-[rgba(40,60,61,0.30)] rounded-[17px] overflow-hidden flex flex-col justify-start items-start ${section.type === 'checkbox' ? `pt-[12px] pb-[20px] pl-[21px] ${section.title === 'Food' ? 'pr-[14px]' : 'pr-[22px]'} gap-[14px]` : 'px-[21px] py-[12px] pb-[20px] gap-[15px]'}`}>
                            <h3 className={`text-[#F9F9F9] text-base font-semibold font-['Manrope'] ${section.type === 'checkbox' ? 'self-stretch h-[25px]' : ''}`}>{section.title}</h3>

                            {section.type === 'radio' ? (
                                <>
                                    <div className="self-stretch h-0 outline-1 outline-[#14FFEC]" style={{ outlineOffset: '-0.5px' }} />
                                    <div className="self-stretch justify-between items-center inline-flex pr-4 pb-[12px]">
                                        <div className="w-[88px] flex-col justify-start items-start gap-[7px] inline-flex">
                                            {section.options.map((option) => (
                                                <div key={option.id} className="self-stretch h-[21px] text-[#F9F9F9] text-base font-medium font-['Manrope']">
                                                    {option.label}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-4 h-[128px] relative">
                                            {section.options.map((option, index) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleOptionToggle(section.id, option.id)}
                                                    className={`w-4 h-4 left-0 absolute rounded-full border-2 ${option.selected ? 'border-[#14FFEC] bg-[#14FFEC]' : 'border-[#14FFEC]'
                                                        }`}
                                                    style={{ top: `${index * 28}px` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={`self-stretch justify-start items-start gap-3 flex flex-wrap ${section.title === 'Food' ? 'content-start pb-[20px]' : 'content-center'} min-h-[40px]`}>
                                    {section.options.map((option) => {
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionToggle(section.id, option.id)}
                                                className={`h-[31px] pt-2 pb-2 pl-3 pr-[7px] overflow-hidden rounded-[30px] justify-start items-center flex ${option.selected
                                                    ? 'bg-[#14FFEC] text-black'
                                                    : 'bg-[rgba(40,60,61,0.30)] text-white'
                                                    } transition-colors ${option.id === 'burgers-sandwich' ? 'gap-[3px]' : option.id === 'continental' ? 'gap-[3px]' : option.id === 'bar-snacks' ? 'gap-[2px]' : option.id === 'steak' ? 'gap-[2px]' : option.id === 'kebabs' ? 'gap-[2px]' : option.id === 'desserts' ? 'gap-[2px]' : 'gap-[2px]'}`}
                                            >
                                                {option.icon && (
                                                    // Standard icon layout using proper icons from filter folder
                                                    <div className="w-5 h-5 relative overflow-hidden flex items-center justify-center mr-1">
                                                        <Image
                                                            src={`/filter/${option.icon}`}
                                                            alt={option.label}
                                                            width={20}
                                                            height={20}
                                                            className="text-[#14FFEC]"
                                                            style={{ filter: 'none', color: '#14FFEC' }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="h-[18px] text-center justify-center flex flex-col text-base font-normal font-['Manrope'] leading-[21px] whitespace-nowrap">
                                                    {option.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-3 px-4 bg-[rgba(40,60,61,0.30)] text-white rounded-[17px] font-semibold font-['Manrope'] transition-colors hover:bg-[rgba(40,60,61,0.50)]"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 py-3 px-4 bg-[#14FFEC] text-black rounded-[17px] font-semibold font-['Manrope'] transition-colors hover:bg-[#11d4c4]"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPopup;