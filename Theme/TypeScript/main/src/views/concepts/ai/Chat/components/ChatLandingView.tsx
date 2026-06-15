import useChatSend from '../hooks/useChatSend'
import {
    PiLightbulbDuotone,
    PiBookOpenTextDuotone,
    PiCompassDuotone,
    PiCodeDuotone,
} from 'react-icons/pi'
import type { ReactNode } from 'react'

type PromptType = 'idea' | 'guide' | 'writing' | 'coding'

const suggeustionIcon: Record<PromptType, ReactNode> = {
    idea: <PiLightbulbDuotone className="text-blue-500" />,
    guide: <PiCompassDuotone className="text-emerald-500" />,
    writing: <PiBookOpenTextDuotone className="text-amber-500" />,
    coding: <PiCodeDuotone className="text-indigo-500" />,
}

const promptSuggestion: {
    title: string
    prompt: string
    type: PromptType
}[] = [
    {
        title: 'کمکم کن برای یک سفر پیش رو مثل یک کارشناس به نظر برسم',
        prompt: `این آخر هفته قصد دارم برای تماشای نهنگ‌ها بروم و می‌خواهم درباره نهنگ‌های قاتل اطلاعات جالبی داشته باشم تا بتوانم آن‌ها را با دیگران به اشتراک بگذارم. چند حقیقت منحصربه‌فرد و جالب درباره نهنگ‌های قاتل به من بگو.`,
        type: 'guide',
    },
    {
        title: 'یک ارائه فروش منطقی برای یک محصول جدید طراحی کن',
        prompt: `یک ارائه فروش برای یک سشوار که همزمان میکروفون هم هست طراحی کن. مختصر باش و ارائه را به صورت منطقی سازماندهی کن.`,
        type: 'writing',
    },
    {
        title: 'کمکم کن با ۱۰ نکته منظم‌تر شوم',
        prompt: `۱۰ نکته برای نظم‌دهی به اتاقم به من بده.`,
        type: 'idea',
    },
    {
        title: 'کدی برای یک کار خاص بنویس و حالت‌های خاص را هم در نظر بگیر',
        prompt: `یک تابع جاوا بنویس که یک مسیر (path) به عنوان ورودی بگیرد و یک فایل ایجاد کند که تاریخ فعلی سیستم را ذخیره کند. حالت‌های خاص را هم در نظر بگیر.`,
        type: 'coding',
    },
]

const ChatLandingView = () => {
    const { handleSend } = useChatSend()

    return (
        <div className="max-w-[900px] w-full mx-auto mt-20">
            <div>
                <div className="heading-text text-4xl leading-snug">
                    <span className="font-semibold bg-linear-to-r from-indigo-500 to-red-400 bg-clip-text text-transparent text-5xl">
                        سلام!
                    </span>
                    <br />
                    <span>چطور می‌توانم به شما کمک کنم؟</span>
                </div>
                <div className="mt-8 grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {promptSuggestion.map((suggestion) => (
                        <div
                            key={suggestion.title}
                            className="flex flex-col gap-4 justify-between rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-5 min-h-40 2xl:min-h-60 cursor-pointer"
                            role="button"
                            onClick={() => handleSend(suggestion.title)}
                        >
                            <h6 className="font-normal">{suggestion.title}</h6>
                            <div>
                                <div className="bg-white dark:bg-gray-800 rounded-full p-2 inline-flex">
                                    <span className="text-2xl">
                                        {suggeustionIcon[suggestion.type]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ChatLandingView
