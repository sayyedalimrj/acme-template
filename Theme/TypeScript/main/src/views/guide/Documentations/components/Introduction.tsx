/* eslint-disable react/no-unescaped-entities */
const coreFeatures = [
    {
        id: 'react',
        name: 'React',
        img: '/img/thumbs/react.png',
        src: 'https://reactjs.org/',
        description:
            'یک کتابخانه جاوااسکریپت محبوب برای ساخت رابط کاربری.',
    },
    {
        id: 'vite',
        name: 'Vite',
        img: '/img/thumbs/vite.png',
        src: 'https://vitejs.dev/',
        description:
            'Vite یک ابزار مدرن و سریع برای ساخت و بسته‌بندی است.',
    },
    {
        id: 'typeScriptOrJavascript',
        name: 'TypeScript or JavaScript',
        img: '/img/thumbs/typeScript.png',
        img2: '/img/thumbs/javaScript.png',
        src: 'https://www.typescriptlang.org/',
        description:
            'TypeScript یک زبان برنامه‌نویسی با تایپ قوی است که بر اساس جاوااسکریپت بنا شده است.',
        dual: true,
    },
    {
        id: 'tailwind',
        name: 'Tailwind Css',
        img: '/img/thumbs/tailwind.png',
        src: 'https://tailwindcss.com/',
        description: 'یک چارچوب سی‌اس‌اس اولویت‌دار با کلاس‌ها.',
    },
]

const Introduction = () => {
    return (
        <>
            <div id="introduction" className="mb-8">
                <p>
                    Ecme نه تنها یک قالب وب معمولی است، بلکه یک شاهکار دقیقاً ساخته شده است که در بازار پر از گزینه‌های طراحی ضعیف و معمولی، برجسته می‌شود. هر جنبه از Ecme، از رابط کاربری ظریف آن تا معماری کد قوی آن، به دقت طراحی شده است تا انعطاف‌پذیری و مقیاس‌پذیری بی‌نظیر برای پروژه‌های شما تضمین کند.
                </p>
                <p>
                    برخلاف سایر قالب‌هایی که به کتابخانه‌های منبع باز معمولی تکیه می‌کنند، Ecme مجموعه‌ای جامع از کامپوننت‌های UI سفارشی دارد. این کامپوننت‌ها نه تنها از نظر عملکرد غنی هستند بلکه کنترل بیشتری نیز ارائه می‌دهند، به شما اجازه می‌دهند که هر جزئیات را مطابق با نیازهای خاص خود تنظیم کنید.
                </p>
                <p>
                    Ecme با ویژگی‌های پیشرفته‌ای مانند پشتیبانی از چند زبان، حالت تاریک و روشن، چیدمان راست به چپ، سفارشی‌سازی رنگ تم و توانایی تغییر بین شش چیدمان پیش‌طراحی شده، مجهز شده است. چه شما یک پلتفرم جهانی یا یک برنامه نیش می‌سازید، انعطاف‌پذیری Ecme شما را پوشش می‌دهد.
                </p>
                <p>
                    علاوه بر این، نمونه‌های برنامه‌ای که شامل شده‌اند، بر اساس موارد استفاده واقعی بنا شده‌اند، به شما راه‌حل‌های عملی و آماده برای استفاده در پروژه‌های شما می‌دهند. با Ecme، شما نه تنها یک قالب می‌خواهید، بلکه یک پایه قدرتمند و انعطاف‌پذیر برای موفقیت توسعه وب خود سرمایه‌گذاری می‌کنید.
                </p>
            </div>
            <div id="coreLibrary">
                <h4>کتابخانه‌های اصلی استفاده شده</h4>
                <p>اینجا لیستی از کتابخانه‌های اصلی است که در Ecme استفاده می‌کنیم</p>
                <div className="grid grid-cols-2 gap-4">
                    {coreFeatures.map((feat) => (
                        <a
                            key={feat.id}
                            className="border-2 border-gray-200 dark:border-gray-700 hover:border-primary flex flex-col items-center justify-center py-4 rounded-xl gap-2 no-underline"
                            href={feat.src}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div className="flex items-center gap-2">
                                <img
                                    className="max-h-16"
                                    src={feat.img}
                                    alt={feat.name}
                                />
                                {feat.dual && (
                                    <img
                                        className="max-h-16"
                                        src={feat.img2}
                                        alt={feat.name}
                                    />
                                )}
                            </div>
                            <div className="text-center">
                                <div className="heading-text font-bold">
                                    {feat.name}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </>
    )
}

export default Introduction
