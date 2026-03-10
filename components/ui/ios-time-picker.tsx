'use client';

import React, { useRef, useEffect, UIEvent } from 'react';

interface IosTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export function IosTimePicker({ value, onChange }: IosTimePickerProps) {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const diffDays = Math.round((selectedDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    const daysItems = Array.from({ length: 8 }, (_, i) => {
        if (i === 0) return '오늘';
        if (i === 1) return '내일';
        if (i === 2) return '모레';
        const d = new Date(todayDate);
        d.setDate(d.getDate() + i);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
    });

    const currentDayStr = daysItems[Math.max(0, Math.min(7, diffDays))] || '오늘';

    const isPM = value.getHours() >= 12;
    const ampm = isPM ? '오후' : '오전';
    const hour = (value.getHours() % 12) || 12;
    const minute = value.getMinutes();

    const periods = ['오전', '오후'];
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    // Using 5-minute intervals for taxi pools is generally much better UX
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    const updateTime = (newDayStr: string, newAmpm: string, newHourStr: string, newMinuteStr: string) => {
        const newDate = new Date(value);

        // 1. Minute change (using delta logic to roll over hours)
        const newM = parseInt(newMinuteStr, 10);
        const currentM = Math.round(minute / 5) * 5 % 60;

        if (newM !== currentM) {
            let deltaMin = newM - currentM;
            if (deltaMin < -30) deltaMin += 60;
            if (deltaMin > 30) deltaMin -= 60;
            newDate.setMinutes(newDate.getMinutes() + deltaMin);
        }

        // 2. Hour change (using delta logic to seamlessly cross AM/PM and Midnight)
        const newH = parseInt(newHourStr, 10);
        if (newH !== hour) {
            let deltaHour = newH - hour;
            if (deltaHour < -6) deltaHour += 12;
            if (deltaHour > 6) deltaHour -= 12;
            newDate.setHours(newDate.getHours() + deltaHour);
        }

        // 3. AMPM Manual change
        if (newAmpm !== ampm) {
            if (newAmpm === '오후') newDate.setHours(newDate.getHours() + 12);
            else newDate.setHours(newDate.getHours() - 12);
        }

        // 4. Day Manual change
        if (newDayStr !== currentDayStr) {
            const dayOffset = daysItems.indexOf(newDayStr) - daysItems.indexOf(currentDayStr);
            newDate.setDate(newDate.getDate() + dayOffset);
        }

        onChange(newDate);
    };

    return (
        <div className="flex justify-center items-center h-[160px] relative bg-[#F2F4F6] rounded-2xl overflow-hidden select-none">
            {/* Background highlight bar */}
            <div className="absolute top-1/2 left-4 right-4 h-[44px] -translate-y-1/2 bg-white rounded-xl shadow-sm pointer-events-none" />


            <div className="flex gap-2 z-10 w-full px-4 text-center">
                <PickerColumn
                    items={daysItems}
                    value={currentDayStr}
                    onChange={(v) => updateTime(v, ampm, hour.toString(), minute.toString().padStart(2, '0'))}
                    width="flex-[1.2] text-[15px]"
                />
                <PickerColumn
                    items={periods}
                    value={ampm}
                    onChange={(v) => updateTime(currentDayStr, v, hour.toString(), minute.toString().padStart(2, '0'))}
                    width="flex-1 text-[17px]"
                />
                <PickerColumn
                    items={hours}
                    value={hour.toString()}
                    onChange={(v) => updateTime(currentDayStr, ampm, v, minute.toString().padStart(2, '0'))}
                    width="flex-1 text-xl"
                    infinite
                />
                <div className="flex items-center justify-center text-xl font-bold text-[#191F28] pb-1 w-2">:</div>
                <PickerColumn
                    items={minutes}
                    value={(Math.round(minute / 5) * 5 % 60).toString().padStart(2, '0')}
                    onChange={(v) => updateTime(currentDayStr, ampm, hour.toString(), v)}
                    width="flex-1 text-xl"
                    infinite
                />
            </div>
        </div>
    );
}

function PickerColumn({ items, value, onChange, width, infinite = false }: { items: string[], value: string, onChange: (val: string) => void, width: string, infinite?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isAutoScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout>();
    const itemHeight = 44;

    // Make the array 100 times longer for infinite scroll illusion
    const displayItems = infinite ? Array(100).fill(items).flat() : items;

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        if (isAutoScrolling.current) return;

        const el = e.currentTarget;
        const centerIndex = Math.round(el.scrollTop / itemHeight);
        if (displayItems[centerIndex] && displayItems[centerIndex] !== value) {
            onChange(displayItems[centerIndex]);
        }
    };

    const smoothScrollTo = (top: number, behavior: ScrollBehavior = 'smooth') => {
        if (!containerRef.current) return;
        isAutoScrolling.current = true;
        containerRef.current.scrollTo({ top, behavior });

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        // Allow 400ms for smooth scroll settling before accepting manual scroll inputs
        scrollTimeout.current = setTimeout(() => {
            isAutoScrolling.current = false;
        }, 400);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const currentScrollTop = containerRef.current.scrollTop;
        const currentIndex = Math.round(currentScrollTop / itemHeight);

        // Check if the current visible item matches the desired value
        if (displayItems[currentIndex] === value) {
            // Teleport silently to the middle if approaching the absolute edge
            if (infinite && (currentIndex < items.length * 5 || currentIndex > displayItems.length - items.length * 5)) {
                const middleOffset = Math.floor(displayItems.length / 2);
                const targetIdx = middleOffset - (middleOffset % items.length) + items.indexOf(value);
                smoothScrollTo(targetIdx * itemHeight, 'instant');
            }
            return;
        }

        // Otherwise, find the *nearest* occurrence of `value` to seamlessly smooth scroll
        let minDiff = Infinity;
        let targetIdx = -1;

        for (let i = 0; i < displayItems.length; i++) {
            if (displayItems[i] === value) {
                const diff = Math.abs(i - currentIndex);
                if (diff < minDiff) {
                    minDiff = diff;
                    targetIdx = i;
                }
            }
        }

        if (targetIdx !== -1) {
            if (currentScrollTop === 0 && infinite) {
                const middleOffset = Math.floor(displayItems.length / 2);
                targetIdx = middleOffset - (middleOffset % items.length) + items.indexOf(value);
                smoothScrollTo(targetIdx * itemHeight, 'instant');
            } else {
                smoothScrollTo(targetIdx * itemHeight, 'smooth');
            }
        }
    }, [value, items, itemHeight, displayItems, infinite]);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`h-[160px] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${width}`}
        >
            <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center" />
            {displayItems.map((item, i) => (
                <div
                    key={i}
                    style={{ height: itemHeight }}
                    className={`flex flex-col items-center justify-center snap-center font-semibold transition-colors duration-200
            ${item === value ? 'text-[#191F28]' : 'text-gray-400'}`}
                >
                    {item}
                </div>
            ))}
            <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center" />
        </div>
    );
}
